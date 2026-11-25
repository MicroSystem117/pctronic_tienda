import type { PaginatedData } from '../../../shared/contracts/api-response.js';

export interface CategoryEntity {
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

export interface ProductVariantEntity {
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

export interface TrendingSearchTerm {
  readonly term: string;
  readonly search_count: number;
}

export interface StoreProductDetail extends StoreProductSummary {
  readonly description: string | null;
  readonly specs: Record<string, string>;
  readonly variants: readonly ProductVariantEntity[];
  readonly images: readonly {
    readonly product_image_id: number;
    readonly image_url: string;
    readonly image_alt: string;
    readonly display_order: number;
    readonly is_primary: boolean;
  }[];
}

export interface StoreProductQuery {
  readonly q?: string | undefined;
  readonly category_slug?: string | undefined;
  readonly in_stock?: boolean | undefined;
  readonly min_price?: number | undefined;
  readonly max_price?: number | undefined;
  readonly sort:
    | 'featured'
    | 'popular'
    | 'bestsellers'
    | 'most_searched'
    | 'price_asc'
    | 'price_desc'
    | 'newest'
    | 'rating_desc';
  readonly page: number;
  readonly page_size: number;
}

export interface CatalogRepositoryPort {
  listStoreCategories(): Promise<readonly CategoryEntity[]>;
  listStoreProducts(query: StoreProductQuery): Promise<PaginatedData<StoreProductSummary>>;
  listTrendingSearches(limit: number): Promise<readonly TrendingSearchTerm[]>;
  findStoreProductBySlug(slug: string): Promise<StoreProductDetail | null>;
}
