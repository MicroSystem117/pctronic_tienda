import { NotFoundError } from '../../../shared/domain/app-error.js';
import type {
  CatalogRepositoryPort,
  StoreProductQuery,
} from '../domain/catalog.repository.js';

export class CatalogService {
  constructor(private readonly catalogRepo: CatalogRepositoryPort) {}

  listStoreCategories() {
    return this.catalogRepo.listStoreCategories();
  }

  listStoreProducts(query: StoreProductQuery) {
    return this.catalogRepo.listStoreProducts(query);
  }

  listTrendingSearches(limit: number) {
    return this.catalogRepo.listTrendingSearches(limit);
  }

  async getStoreProductBySlug(slug: string) {
    const product = await this.catalogRepo.findStoreProductBySlug(slug);
    if (!product) {
      throw new NotFoundError(`Producto '${slug}' no encontrado`);
    }
    return product;
  }
}
