import { dbPool } from '../../../shared/infrastructure/database/pool.js';
import type {
  PaymentAccountsConfig,
  SettingsRepositoryPort,
  StoreSettingsEntity,
} from '../domain/settings.repository.js';

interface ConfigRow {
  clave: string;
  valor: string;
}

interface SvaMetodoPagoRow {
  tipo: 'pago_movil' | 'transferencia' | 'binance' | 'zelle' | 'efectivo' | 'otro';
  titulo: string;
  banco: string | null;
  titular: string | null;
  documento_identidad: string | null;
  numero_cuenta_telefono: string | null;
  correo: string | null;
  instrucciones: string | null;
}

export class MariaDbSettingsRepository implements SettingsRepositoryPort {
  async getSettings(): Promise<StoreSettingsEntity> {
    const configRows = (await dbPool.query(
      `SELECT clave, valor FROM configuracion WHERE clave IN (
        'empresa_nombre', 'empresa_rif', 'empresa_telefono', 'empresa_email', 'empresa_direccion',
        'tasa_bcv', 'tasa_binance', 'moneda_principal',
        'pago_movil_banco', 'pago_movil_telefono', 'pago_movil_rif',
        'transf_banco', 'transf_cuenta', 'transf_titular', 'transf_rif',
        'zelle_email', 'zelle_titular', 'binance_pay_id', 'binance_email'
      )`,
    )) as ConfigRow[];

    const cfg: Record<string, string> = {};
    for (const row of configRows) {
      cfg[row.clave] = row.valor;
    }

    let metodos: SvaMetodoPagoRow[] = [];
    try {
      metodos = (await dbPool.query(
        `SELECT tipo, titulo, banco, titular, documento_identidad,
                numero_cuenta_telefono, correo, instrucciones
           FROM metodos_pago
          WHERE activo = 1
          ORDER BY orden ASC, id ASC`,
      )) as SvaMetodoPagoRow[];
    } catch {
      metodos = [];
    }

    const byType = new Map<string, SvaMetodoPagoRow>();
    for (const m of metodos) {
      if (!byType.has(m.tipo)) byType.set(m.tipo, m);
    }

    const companyName = cfg['empresa_nombre']?.trim() || 'PC TRONIC';
    const companyRif = cfg['empresa_rif']?.trim() || 'J-41317926-1';
    const bcvRate = Number(cfg['tasa_bcv']) || 88.0;
    const binanceRate = Number(cfg['tasa_binance']) || 95.0;
    const currency = (cfg['moneda_principal'] || 'USD').toUpperCase();

    const pm = byType.get('pago_movil');
    const tr = byType.get('transferencia');
    const zl = byType.get('zelle');
    const bn = byType.get('binance');
    const ef = byType.get('efectivo');

    const paymentAccounts: PaymentAccountsConfig = {
      pago_movil: {
        enabled: pm ? true : Boolean(cfg['pago_movil_telefono'] || cfg['pago_movil_banco']),
        bank: pm?.banco || cfg['pago_movil_banco'] || 'Banesco (0134)',
        phone: pm?.numero_cuenta_telefono || cfg['pago_movil_telefono'] || '',
        document_id: pm?.documento_identidad || cfg['pago_movil_rif'] || companyRif,
        holder_name: pm?.titular || cfg['transf_titular'] || companyName,
        instructions: pm?.instrucciones ?? null,
      },
      transferencia: {
        enabled: tr ? true : Boolean(cfg['transf_cuenta'] || cfg['transf_banco']),
        bank: tr?.banco || cfg['transf_banco'] || 'Banesco Banco Universal',
        account_number: tr?.numero_cuenta_telefono || cfg['transf_cuenta'] || '',
        account_type: 'Corriente',
        document_id: tr?.documento_identidad || cfg['transf_rif'] || companyRif,
        holder_name: tr?.titular || cfg['transf_titular'] || companyName,
        instructions: tr?.instrucciones ?? null,
      },
      zelle: {
        enabled: zl ? true : Boolean(cfg['zelle_email']),
        email: zl?.correo || cfg['zelle_email'] || '',
        holder_name: zl?.titular || cfg['zelle_titular'] || companyName,
        instructions: zl?.instrucciones ?? null,
      },
      binance: {
        enabled: bn ? true : Boolean(cfg['binance_pay_id'] || cfg['binance_email']),
        pay_id: bn?.numero_cuenta_telefono || cfg['binance_pay_id'] || '',
        email: bn?.correo || cfg['binance_email'] || '',
        holder_name: bn?.titular || 'Binance Pay',
        instructions: bn?.instrucciones ?? null,
      },
      efectivo: {
        enabled: ef ? true : true,
        instructions: ef?.instrucciones ?? 'Pago directo en tienda física o contraentrega.',
      },
    };

    return {
      company_name: companyName,
      company_rif: companyRif,
      company_phone: cfg['empresa_telefono']?.trim() || '+58 414-0000000',
      company_email: cfg['empresa_email']?.trim() || 'ventas@pctronic.com.ve',
      company_address: cfg['empresa_direccion']?.trim() || 'Venezuela',
      free_shipping_threshold: 150,
      free_shipping_enabled: true,
      currency,
      bcv_rate: bcvRate,
      binance_rate: binanceRate,
      show_bs_prices: true,
      payment_accounts: paymentAccounts,
    };
  }
}
