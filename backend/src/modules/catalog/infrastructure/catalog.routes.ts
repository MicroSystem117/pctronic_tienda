import { Router } from 'express';
import { z } from 'zod';
import { okResponse } from '../../../shared/contracts/api-response.js';
import { validateQuery } from '../../../shared/infrastructure/http/middlewares.js';
import type { CatalogService } from '../application/catalog.service.js';

const storeProductsQuery = z.object({
  q: z.string().trim().max(120).optional(),
  category_slug: z.string().trim().max(140).optional(),
  in_stock: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  sort: z
    .enum([
      'featured',
      'popular',
      'bestsellers',
      'most_searched',
      'price_asc',
      'price_desc',
      'newest',
      'rating_desc',
    ])
    .default('popular'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(48).default(12),
});

const trendingSearchesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(6),
});

export function createStoreCatalogRouter(catalogService: CatalogService): Router {
  const router = Router();

  router.get('/categories', async (_req, res, next) => {
    try {
      const items = await catalogService.listStoreCategories();
      res.status(200).json(okResponse({ items }, 'Categorías obtenidas'));
    } catch (err) {
      next(err);
    }
  });

  router.get('/products', validateQuery(storeProductsQuery), async (req, res, next) => {
    try {
      const data = await catalogService.listStoreProducts(
        req.query as unknown as z.infer<typeof storeProductsQuery>,
      );
      res.status(200).json(okResponse(data, 'Catálogo obtenido'));
    } catch (err) {
      next(err);
    }
  });

  router.get('/trending-searches', validateQuery(trendingSearchesQuery), async (req, res, next) => {
    try {
      const limit = Number(req.query.limit ?? 6);
      const items = await catalogService.listTrendingSearches(limit);
      res.status(200).json(okResponse({ items }, 'Búsquedas populares obtenidas'));
    } catch (err) {
      next(err);
    }
  });

  router.get('/products/:slug', async (req, res, next) => {
    try {
      const slug = String(req.params.slug ?? '').trim();
      const product = await catalogService.getStoreProductBySlug(slug);
      res.status(200).json(okResponse(product, 'Detalle de producto obtenido'));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
