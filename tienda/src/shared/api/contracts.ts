/**
 * Contratos tipados de consumo de la Tienda Online PC TRONIC.
 * Fuente única de verdad: docs/api-contracts.md (API v1).
 */

export type DeliveryType = 'retira_tienda' | 'delivery';
export type SvaOrderStatus =
  | 'pendiente_verificacion'
  | 'pago_aprobado'
  | 'listo_para_retirar'
  | 'en_delivery'
  | 'entregado'
  | 'rechazado';

export interface ApiResponse<TData> {
  readonly status: 'success' | 'error';
  readonly data: TData;
  readonly message: string;
}

export interface StoreBanner {
  readonly banner_id: number;
  readonly badge_text: string | null;
  readonly title: string;
  readonly highlight_text: string | null;
  readonly subtitle: string | null;
  readonly image_url: string;
  readonly image_alt: string;
  readonly cta_label: string;
  readonly cta_url: string;
  readonly color_start: string;
  readonly color_end: string;
  readonly gradient_angle: number;
  readonly display_order: number;
}

export interface StoreCategory {
  readonly category_id: number;
  readonly name: string;
  readonly slug: string;
  readonly subtitle: string | null;
  readonly description: string | null;
  readonly icon: string | null;
  readonly image_url: string | null;
  readonly display_order: number;
  readonly active_products_count: number;
}

export interface ProductVariant {
  readonly variant_id: number;
  readonly talla: string;
  readonly color: string;
  readonly stock: number;
  readonly sku: string | null;
  readonly price: number | null;
}

export interface StoreProductSummary {
  readonly product_id: number;
  readonly sku: string;
  readonly name: string;
  readonly slug: string;
  readonly category_id: number;
  readonly category_name: string;
  readonly brand: string | null;
  readonly compatibility_or_model: string | null;
  readonly short_description: string | null;
  readonly price: number;
  readonly compare_at_price: number | null;
  readonly currency: string;
  readonly stock_quantity: number;
  readonly in_stock: boolean;
  readonly rating_average: number;
  readonly rating_count: number;
  readonly thumbnail_url: string | null;
  readonly is_featured: boolean;
  readonly sold_count: number;
  readonly search_count: number;
  readonly popularity_score: number;
}

export interface ProductDetail extends StoreProductSummary {
  readonly description: string | null;
  readonly specs: Record<string, string>;
  readonly variants: readonly ProductVariant[];
  readonly images: readonly {
    readonly product_image_id: number;
    readonly image_url: string;
    readonly image_alt: string;
    readonly display_order: number;
    readonly is_primary: boolean;
  }[];
}

export interface TrendingSearchTerm {
  readonly term: string;
  readonly search_count: number;
}

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

export interface StoreSettings {
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

export interface StoreUser {
  readonly user_id: number;
  readonly full_name: string;
  readonly email: string;
  readonly role: string;
  readonly phone?: string | null;
  readonly shipping_address?: string | null;
  readonly city?: string | null;
  readonly document_id?: string | null;
}

export interface RegisterCustomerRequest {
  readonly full_name: string;
  readonly email: string;
  readonly password: string;
  readonly phone: string;
  readonly document_id?: string | null;
  readonly shipping_address: string;
  readonly city: string;
}

export interface CreateStoreOrderRequest {
  readonly customer: {
    readonly full_name: string;
    readonly email: string;
    readonly phone: string;
    readonly document_id?: string;
    readonly shipping_address: string;
    readonly city: string;
  };
  readonly delivery_type: DeliveryType;
  readonly payment_method: 'efectivo' | 'transferencia' | 'tarjeta' | 'pago_movil' | 'zelle' | 'binance' | 'otro';
  readonly payment_reference?: string;
  readonly notes?: string;
  readonly payment_receipt_data?: string;
  readonly items: readonly {
    readonly product_id: number;
    readonly variant_id?: number | null;
    readonly quantity: number;
  }[];
}

export interface CreateStoreOrderResponse {
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
