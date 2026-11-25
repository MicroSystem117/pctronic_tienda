export interface PaymentAccountsConfig {
  readonly pago_movil: {
    readonly enabled: boolean;
    readonly bank: string;
    readonly phone: string;
    readonly document_id: string;
    readonly holder_name: string;
    readonly instructions: string | null;
  };
  readonly transferencia: {
    readonly enabled: boolean;
    readonly bank: string;
    readonly account_number: string;
    readonly account_type: string;
    readonly document_id: string;
    readonly holder_name: string;
    readonly instructions: string | null;
  };
  readonly zelle: {
    readonly enabled: boolean;
    readonly email: string;
    readonly holder_name: string;
    readonly instructions: string | null;
  };
  readonly binance: {
    readonly enabled: boolean;
    readonly pay_id: string;
    readonly email: string;
    readonly holder_name: string;
    readonly instructions: string | null;
  };
  readonly efectivo: {
    readonly enabled: boolean;
    readonly instructions: string | null;
  };
}

export interface StoreSettingsEntity {
  readonly company_name: string;
  readonly company_rif: string;
  readonly company_phone: string;
  readonly company_email: string;
  readonly company_address: string;
  readonly free_shipping_threshold: number;
  readonly free_shipping_enabled: boolean;
  readonly currency: string;
  readonly bcv_rate: number;
  readonly binance_rate: number;
  readonly show_bs_prices: boolean;
  readonly payment_accounts: PaymentAccountsConfig;
}

export interface SettingsRepositoryPort {
  getSettings(): Promise<StoreSettingsEntity>;
}
