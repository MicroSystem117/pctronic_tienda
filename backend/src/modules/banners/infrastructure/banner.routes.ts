import { Router } from 'express';
import { okResponse } from '../../../shared/contracts/api-response.js';
import type { BannerService } from '../application/banner.service.js';

export function createStoreBannerRouter(bannerService: BannerService): Router {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const items = await bannerService.listForStore();
      res.status(200).json(okResponse({ items }, 'Banners activos obtenidos'));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
