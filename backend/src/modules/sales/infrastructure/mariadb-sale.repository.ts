import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { PoolConnection } from 'mariadb';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../shared/domain/app-error.js';
import { svaRootPath } from '../../../shared/infrastructure/config/env.js';
import { dbPool } from '../../../shared/infrastructure/database/pool.js';
import type {
  CreatedOrderSummary,
  CreateOrderInTxInput,
  DeliveryType,
  SaleRepositoryPort,
  SvaOrderStatus,
  TrackedOrderDetail,
} from '../domain/sale.repository.js';

interface LockedProductRow {
  id: number;
  codigo: string;
  nombre: string;
  precio_usd: number;
  stock_actual: number;
  estado: string;
}

interface SvaPedidoRow {
  id: number;
  nro_pedido: string;
  cliente_id: number;
  cliente_nombre: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  cliente_whatsapp: string | null;
  tipo_entrega: DeliveryType;
  direccion_delivery: string | null;
  telefono_contacto: string | null;
  forma_pago: string;
  referencia_pago: string | null;
  subtotal_usd: number;
  delivery_usd: number;
  total_usd: number;
  tasa_bcv_dia: number;
  estado: SvaOrderStatus;
  codigo_entrega: string | null;
  repartidor_nombre: string | null;
  repartidor_telefono: string | null;
  motivo_rechazo: string | null;
  created_at: Date;
}

function normalizePhone(val: string | null | undefined): string {
  return (val ?? '').replace(/\D+/g, '');
}

function saveReceiptToSvaDisk(orderNumber: string, dataUrl: string | null): string | null {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;

  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
  if (!match || !match[1] || !match[2]) {
    throw new ValidationError('Formato de comprobante inválido (solo PNG, JPG o WEBP)');
  }

  const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length < 16 || buffer.length > 2 * 1024 * 1024) {
    throw new ValidationError('La imagen del comprobante debe ser válida y menor a 2 MB');
  }

  const fileName = `comp_${orderNumber.replace(/[^a-zA-Z0-9_-]/g, '')}_${crypto.randomBytes(3).toString('hex')}.${ext}`;
  const dirs = [
    path.join(svaRootPath, 'uploads', 'comprobantes'),
    path.join(svaRootPath, 'public', 'uploads', 'comprobantes'),
  ];

  let savedAny = false;
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, fileName), buffer);
      savedAny = true;
    } catch {
      // Si SVA aún no existe en disco en entornos aislados, continúa sin abortar si al menos uno guarda
    }
  }

  return savedAny ? `uploads/comprobantes/${fileName}` : null;
}

export class MariaDbSaleRepository implements SaleRepositoryPort {
  async createOrderInTx(
    conn: PoolConnection,
    input: CreateOrderInTxInput,
  ): Promise<CreatedOrderSummary> {
    const customerId = await this.resolveCustomerId(conn, input);
    const actorUserId = await this.resolveSvaUserId(conn, input.user_id);

    const aggregated = new Map<string, { product_id: number; variant_id: number | null; quantity: number }>();
    for (const item of input.items) {
      const variantId = item.variant_id ?? null;
      const key = `${item.product_id}:${variantId ?? 'base'}`;
      const existing = aggregated.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        aggregated.set(key, {
          product_id: item.product_id,
          variant_id: variantId,
          quantity: item.quantity,
        });
      }
    }

    const sortedLines = [...aggregated.values()].sort(
      (a, b) => a.product_id - b.product_id || (a.variant_id ?? 0) - (b.variant_id ?? 0),
    );

    const lockedLines: {
      product_id: number;
      variant_id: number | null;
      talla: string | null;
      color: string | null;
      quantity: number;
      unit_price: number;
      line_total: number;
    }[] = [];

    const configRows = (await conn.query(
      `SELECT clave, valor FROM configuracion WHERE clave IN ('tasa_bcv', 'tasa_binance', 'recargo_cashea', 'recargo_cashea_en_bcv')`,
    )) as { clave: string; valor: string }[];
    let tasaBcv = 922.56;
    let tasaBinance = 1107.40;
    let recargoCashea = 16.0;
    let casheaActive = false;
    for (const cr of configRows) {
      if (cr.clave === 'tasa_bcv') tasaBcv = Number(cr.valor) || 922.56;
      if (cr.clave === 'tasa_binance') tasaBinance = Number(cr.valor) || 1107.40;
      if (cr.clave === 'recargo_cashea') recargoCashea = Number(cr.valor) || 16.0;
      if (cr.clave === 'recargo_cashea_en_bcv') casheaActive = Number(cr.valor) === 1;
    }
    const factorBrecha = (tasaBcv > 0 && tasaBinance > 0) ? (tasaBinance / tasaBcv) : 1.0;

    let subtotal = 0;

    for (const line of sortedLines) {
      const prodRows = (await conn.query(
        `SELECT id, codigo, nombre, precio_usd, stock_actual, estado
           FROM productos
          WHERE id = ?
          LIMIT 1 FOR UPDATE`,
        [line.product_id],
      )) as LockedProductRow[];

      const prod = prodRows[0];
      if (!prod || prod.estado !== 'activo') {
        throw new NotFoundError(`Producto ${line.product_id} no disponible`);
      }

      const reservedRows = (await conn.query(
        `SELECT COALESCE(SUM(pd.cantidad), 0) AS reserved_qty
           FROM pedidos_detalles pd
           INNER JOIN pedidos pe ON pe.id = pd.pedido_id
          WHERE pd.producto_id = ?
            AND pe.estado = 'pendiente_verificacion'`,
        [line.product_id],
      )) as { reserved_qty: number }[];
      const reservedQty = Number(reservedRows[0]?.reserved_qty ?? 0);

      let rawBasePrice = Number(prod.precio_usd);
      let availableStock = Math.max(0, Number(prod.stock_actual) - reservedQty);
      let talla: string | null = null;
      let color: string | null = null;

      if (line.variant_id !== null) {
        const varRows = (await conn.query(
          `SELECT id, talla, color, stock, precio_usd
             FROM producto_variantes
            WHERE id = ? AND producto_id = ?
            LIMIT 1 FOR UPDATE`,
          [line.variant_id, line.product_id],
        )) as { id: number; talla: string; color: string; stock: number; precio_usd: number | null }[];
        const variant = varRows[0];
        if (!variant) {
          throw new NotFoundError(`Variante ${line.variant_id} no encontrada para el producto`);
        }
        availableStock = Number(variant.stock);
        talla = variant.talla || null;
        color = variant.color || null;
        if (variant.precio_usd !== null && Number(variant.precio_usd) > 0) {
          rawBasePrice = Number(variant.precio_usd);
        }
      }

      const pBcv = Math.round(rawBasePrice * factorBrecha * 100) / 100;
      let unitPrice = pBcv;
      if (casheaActive && recargoCashea > 0) {
        unitPrice = Math.round(pBcv * (1 + (recargoCashea / 100)) * 100) / 100;
      }

      if (availableStock < line.quantity) {
        throw new ConflictError(
          `Stock insuficiente para ${prod.codigo} (${prod.nombre}): disponible ${availableStock}, solicitado ${line.quantity}`,
          'INSUFFICIENT_STOCK',
        );
      }

      const lineTotal = Number((unitPrice * line.quantity).toFixed(2));
      subtotal = Number((subtotal + lineTotal).toFixed(2));

      lockedLines.push({
        product_id: Number(prod.id),
        variant_id: line.variant_id,
        talla,
        color,
        quantity: line.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

// Tasas y recargos obtenidos antes del bucle de items

    const orderNumber = await this.nextOrderNumber(conn);
    const deliveryCode = String(crypto.randomInt(100000, 999999));
    const fullAddress =
      input.delivery_type === 'delivery'
        ? `${input.customer.shipping_address.trim()} (${input.customer.city.trim()})`
        : null;
    const comprobantePath = saveReceiptToSvaDisk(orderNumber, input.payment_receipt_data);

    const orderRes = (await conn.query(
      `INSERT INTO pedidos
        (nro_pedido, cliente_id, usuario_id, tipo_entrega, direccion_delivery,
         telefono_contacto, forma_pago, referencia_pago, comprobante_pago,
         subtotal_usd, delivery_usd, total_usd, tasa_bcv_dia, tasa_binance_dia,
         estado, codigo_entrega, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?, ?, 'pendiente_verificacion', ?, ?)`,
      [
        orderNumber,
        customerId,
        actorUserId,
        input.delivery_type,
        fullAddress,
        input.customer.phone,
        input.payment_method,
        input.payment_reference,
        comprobantePath,
        subtotal,
        subtotal,
        tasaBcv,
        tasaBinance,
        deliveryCode,
        input.notes,
      ],
    )) as { insertId: number };

    const orderId = Number(orderRes.insertId);

    for (const line of lockedLines) {
      await conn.query(
        `INSERT INTO pedidos_detalles
          (pedido_id, producto_id, talla, color, variante_id, cantidad, precio_unitario_usd, total_linea_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          line.product_id,
          line.talla,
          line.color,
          line.variant_id,
          line.quantity,
          line.unit_price,
          line.line_total,
        ],
      );
    }

    return {
      order_id: orderId,
      order_number: orderNumber,
      order_status: 'pendiente_verificacion',
      delivery_code: deliveryCode,
      delivery_type: input.delivery_type,
      subtotal,
      tax_amount: 0,
      total_amount: subtotal,
      currency: 'USD',
      bcv_rate: tasaBcv,
      created_at: new Date().toISOString(),
    };
  }

  async findTrackedOrder(orderNumber: string, contact: string): Promise<TrackedOrderDetail | null> {
    const raw = orderNumber.trim();
    const upper = raw.toUpperCase();
    const candidates = new Set<string>([raw, upper]);
    if (/^\d+$/.test(raw)) {
      candidates.add(`PED-${raw.padStart(5, '0')}`);
    }
    const pedMatch = raw.match(/^ped-(\d+)$/i);
    if (pedMatch && pedMatch[1]) {
      candidates.add(`PED-${pedMatch[1].padStart(5, '0')}`);
    }

    const list = [...candidates];
    const placeholders = list.map(() => '?').join(', ');

    const rows = (await dbPool.query(
      `SELECT p.*, c.nombre AS cliente_nombre, c.email AS cliente_email,
              c.telefono AS cliente_telefono, c.whatsapp AS cliente_whatsapp
         FROM pedidos p
         LEFT JOIN clientes c ON c.id = p.cliente_id
        WHERE UPPER(p.nro_pedido) IN (${placeholders})
        LIMIT 1`,
      list.map((v) => v.toUpperCase()),
    )) as SvaPedidoRow[];

    const row = rows[0];
    if (!row) return null;

    const normalizedContact = contact.trim().toLowerCase();
    const contactDigits = normalizePhone(contact);
    const emailMatch = row.cliente_email?.trim().toLowerCase() === normalizedContact;
    const phoneMatch =
      contactDigits.length >= 6 &&
      [row.telefono_contacto, row.cliente_telefono, row.cliente_whatsapp].some((p) => {
        const d = normalizePhone(p);
        return d.length >= 6 && (d === contactDigits || d.endsWith(contactDigits) || contactDigits.endsWith(d));
      });

    if (!emailMatch && !phoneMatch) {
      throw new ForbiddenError('El correo o teléfono no coincide con el titular del pedido');
    }

    return this.hydrateTrackedOrder(row);
  }

  async listOrdersByUser(userId: number, email: string): Promise<readonly TrackedOrderDetail[]> {
    const userRows = (await dbPool.query(
      `SELECT cliente_id FROM usuarios WHERE id = ? LIMIT 1`,
      [userId],
    )) as { cliente_id: number | null }[];
    const clienteId = userRows[0]?.cliente_id ?? null;

    const rows = (await dbPool.query(
      `SELECT p.*, c.nombre AS cliente_nombre, c.email AS cliente_email,
              c.telefono AS cliente_telefono, c.whatsapp AS cliente_whatsapp
         FROM pedidos p
         LEFT JOIN clientes c ON c.id = p.cliente_id
        WHERE (? IS NOT NULL AND p.cliente_id = ?)
           OR LOWER(c.email) = ?
        ORDER BY p.id DESC
        LIMIT 30`,
      [clienteId, clienteId, email.trim().toLowerCase()],
    )) as SvaPedidoRow[];

    const result: TrackedOrderDetail[] = [];
    for (const row of rows) {
      result.push(await this.hydrateTrackedOrder(row));
    }
    return result;
  }

  private async hydrateTrackedOrder(row: SvaPedidoRow): Promise<TrackedOrderDetail> {
    const items = (await dbPool.query(
      `SELECT pd.producto_id, COALESCE(pr.codigo, 'SKU') AS sku,
              COALESCE(pr.nombre, 'Producto') AS product_name,
              pd.cantidad, pd.precio_unitario_usd, pd.total_linea_usd
         FROM pedidos_detalles pd
         LEFT JOIN productos pr ON pr.id = pd.producto_id
        WHERE pd.pedido_id = ?
        ORDER BY pd.id ASC`,
      [row.id],
    )) as {
      producto_id: number;
      sku: string;
      product_name: string;
      cantidad: number;
      precio_unitario_usd: number;
      total_linea_usd: number;
    }[];

    return {
      order_id: Number(row.id),
      order_number: row.nro_pedido,
      order_status: row.estado,
      delivery_type: row.tipo_entrega,
      delivery_code: row.codigo_entrega ?? null,
      payment_method: row.forma_pago,
      payment_reference: row.referencia_pago ?? null,
      subtotal: Number(row.subtotal_usd),
      delivery_amount: Number(row.delivery_usd),
      total_amount: Number(row.total_usd),
      bcv_rate: Number(row.tasa_bcv_dia),
      currency: 'USD',
      customer_name: row.cliente_nombre ?? 'Cliente',
      shipping_address: row.direccion_delivery ?? null,
      courier_name: row.repartidor_nombre ?? null,
      courier_phone: row.repartidor_telefono ?? null,
      rejection_reason: row.motivo_rechazo ?? null,
      created_at: new Date(row.created_at).toISOString(),
      items: items.map((i) => ({
        product_id: Number(i.producto_id),
        sku: i.sku,
        product_name: i.product_name,
        quantity: Number(i.cantidad),
        unit_price: Number(i.precio_unitario_usd),
        line_total: Number(i.total_linea_usd),
      })),
    };
  }

  private async nextOrderNumber(conn: PoolConnection): Promise<string> {
    const corrRows = (await conn.query(
      `SELECT prefijo, siguiente_numero
         FROM correlativos
        WHERE documento = 'pedido'
        LIMIT 1 FOR UPDATE`,
    )) as { prefijo: string | null; siguiente_numero: number }[];

    const corr = corrRows[0];
    if (corr) {
      const prefix = corr.prefijo || 'PED-';
      const nro = `${prefix}${String(corr.siguiente_numero).padStart(5, '0')}`;
      await conn.query(
        `UPDATE correlativos SET siguiente_numero = siguiente_numero + 1 WHERE documento = 'pedido'`,
      );
      return nro;
    }

    const year = new Date().getUTCFullYear();
    return `PED-${year}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private async resolveSvaUserId(
    conn: PoolConnection,
    requestedUserId?: number | null,
  ): Promise<number> {
    if (requestedUserId) {
      const check = (await conn.query(`SELECT id FROM usuarios WHERE id = ? LIMIT 1`, [
        requestedUserId,
      ])) as { id: number }[];
      if (check[0]) return Number(check[0].id);
    }

    const first = (await conn.query(`SELECT id FROM usuarios ORDER BY id ASC LIMIT 1`)) as {
      id: number;
    }[];
    if (!first[0]) {
      throw new ValidationError('No existe un usuario base en SVA para registrar el pedido');
    }
    return Number(first[0].id);
  }

  private async resolveCustomerId(
    conn: PoolConnection,
    input: CreateOrderInTxInput,
  ): Promise<number> {
    const email = input.customer.email.trim().toLowerCase();
    const docId = input.customer.document_id?.trim() || `V-${Date.now().toString().slice(-8)}`;
    const fullAddress = `${input.customer.shipping_address.trim()} (${input.customer.city.trim()})`;

    const byEmail = (await conn.query(
      `SELECT id FROM clientes WHERE LOWER(email) = ? LIMIT 1`,
      [email],
    )) as { id: number }[];
    if (byEmail[0]) {
      const id = Number(byEmail[0].id);
      await conn.query(
        `UPDATE clientes SET telefono = ?, direccion = ? WHERE id = ?`,
        [input.customer.phone, fullAddress, id],
      );
      return id;
    }

    const byDoc = (await conn.query(
      `SELECT id FROM clientes WHERE cedula_rif = ? LIMIT 1`,
      [docId],
    )) as { id: number }[];
    if (byDoc[0]) return Number(byDoc[0].id);

    const inserted = (await conn.query(
      `INSERT INTO clientes (cedula_rif, nombre, direccion, telefono, whatsapp, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [docId, input.customer.full_name, fullAddress, input.customer.phone, input.customer.phone, email],
    )) as { insertId: number };

    return Number(inserted.insertId);
  }
}
