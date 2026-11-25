import type { PoolConnection } from 'mariadb';

export type DeliveryType = 'retira_tienda' | 'delivery';

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta'
  | 'pago_movil'
  | 'zelle'
  | 'binance'
  | 'otro';

export type SvaOrderStatus =
  | 'pendiente_verificacion'
  | 'pago_aprobado'
  | 'listo_para_retirar'
  | 'en_delivery'
  | 'entregado'
  | 'rechazado';

export interface OrderItemInput {
  readonly product_id: number;
  readonly variant_id?: number | null | undefined;
  readonly quantity: number;
}

export interface CreateOrderInTxInput {
  readonly user_id?: number | null | undefined;
  readonly customer: {
    readonly full_name: string;
    readonly email: string;
    readonly phone: string;
    readonly document_id: string | null;
    readonly shipping_address: string;
    readonly city: string;
  };
  readonly delivery_type: DeliveryType;
  readonly payment_method: PaymentMethod;
  readonly payment_reference: string | null;
  readonly payment_receipt_data: string | null;
  readonly notes: string | null;
  readonly items: readonly OrderItemInput[];
}

export interface CreatedOrderSummary {
  readonly order_id: number;
  readonly order_number: string;
  readonly order_status: SvaOrderStatus;
  readonly delivery_code: string;
  readonly delivery_type: DeliveryType;
  readonly subtotal: number;
  readonly tax_amount: number;
  readonly total_amount: number;
  readonly currency: string;
  readonly bcv_rate: number;
  readonly created_at: string;
}

export interface TrackedOrderDetail {
  readonly order_id: number;
  readonly order_number: string;
  readonly order_status: SvaOrderStatus;
  readonly delivery_type: DeliveryType;
  readonly delivery_code: string | null;
  readonly payment_method: string;
  readonly payment_reference: string | null;
  readonly subtotal: number;
  readonly delivery_amount: number;
  readonly total_amount: number;
  readonly bcv_rate: number;
  readonly currency: string;
  readonly customer_name: string;
  readonly shipping_address: string | null;
  readonly courier_name: string | null;
  readonly courier_phone: string | null;
  readonly rejection_reason: string | null;
  readonly created_at: string;
  readonly items: readonly {
    readonly product_id: number;
    readonly sku: string;
    readonly product_name: string;
    readonly quantity: number;
    readonly unit_price: number;
    readonly line_total: number;
  }[];
}

export interface SaleRepositoryPort {
  createOrderInTx(conn: PoolConnection, input: CreateOrderInTxInput): Promise<CreatedOrderSummary>;
  findTrackedOrder(orderNumber: string, contact: string): Promise<TrackedOrderDetail | null>;
  listOrdersByUser(userId: number, email: string): Promise<readonly TrackedOrderDetail[]>;
}
