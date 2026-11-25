import { Router } from 'express';
import { z } from 'zod';
import { okResponse } from '../../../shared/contracts/api-response.js';
import { runIdempotentTransaction } from '../../../shared/infrastructure/http/idempotency.js';
import {
  authenticateJwt,
  validateBody,
  validateQuery,
} from '../../../shared/infrastructure/http/middlewares.js';
import type { SaleService } from '../application/sale.service.js';

const paymentMethodEnum = z.enum([
  'efectivo',
  'transferencia',
  'tarjeta',
  'pago_movil',
  'zelle',
  'binance',
  'otro',
]);

const deliveryTypeEnum = z.enum(['retira_tienda', 'delivery']);

const orderItemSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  variant_id: z.coerce.number().int().positive().nullable().optional().default(null),
  quantity: z.coerce.number().int().positive().max(1000),
});

const createStoreOrderSchema = z.object({
  customer: z.object({
    full_name: z.string().trim().min(2).max(150),
    email: z.string().trim().email().max(190),
    phone: z.string().trim().min(6).max(40),
    document_id: z.string().trim().max(40).nullable().optional().default(null),
    shipping_address: z.string().trim().min(4).max(300),
    city: z.string().trim().min(2).max(100),
  }),
  delivery_type: deliveryTypeEnum.default('delivery'),
  payment_method: paymentMethodEnum,
  payment_reference: z.string().trim().max(100).nullable().optional().default(null),
  notes: z.string().trim().max(1000).nullable().optional().default(null),
  payment_receipt_data: z
    .string()
    .max(3_000_000, 'La captura de pago excede el tamaño permitido')
    .refine((v) => v.startsWith('data:image/'), 'El comprobante debe ser una imagen válida')
    .nullable()
    .optional()
    .default(null),
  items: z.array(orderItemSchema).min(1).max(50),
});

const trackOrderQuery = z.object({
  contact: z.string().trim().min(4).max(190),
});

export function createStoreOrderRouter(saleService: SaleService): Router {
  const router = Router();

  router.post('/', validateBody(createStoreOrderSchema), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createStoreOrderSchema>;
      const result = await runIdempotentTransaction(
        req,
        'POST /api/v1/store/orders',
        async (conn) => {
          const order = await saleService.createOrderInTx(conn, {
            user_id: req.authUser?.user_id ?? null,
            customer: body.customer,
            delivery_type: body.delivery_type,
            payment_method: body.payment_method,
            payment_reference: body.payment_reference,
            payment_receipt_data: body.payment_receipt_data,
            notes: body.notes,
            items: body.items,
          });
          return {
            statusCode: 201,
            body: okResponse(order, 'Pedido registrado correctamente'),
          };
        },
      );
      res.status(result.statusCode).json(result.body);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:order_number', validateQuery(trackOrderQuery), async (req, res, next) => {
    try {
      const orderNumber = String(req.params.order_number ?? '').trim();
      const contact = String(req.query.contact ?? '').trim();
      const order = await saleService.trackOrder(orderNumber, contact);
      res.status(200).json(okResponse(order, 'Estado del pedido obtenido'));
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createStoreMyOrdersRouter(saleService: SaleService): Router {
  const router = Router();

  router.get('/orders', authenticateJwt, async (req, res, next) => {
    try {
      const orders = await saleService.listMyOrders(req.authUser!.user_id, req.authUser!.email);
      res.status(200).json(okResponse({ items: orders }, 'Pedidos del cliente obtenidos'));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
