import { Router } from 'express';
import { okResponse } from '../../../shared/contracts/api-response.js';
import type { SettingsService } from '../application/settings.service.js';

export function createStoreSettingsRouter(settingsService: SettingsService): Router {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const settings = await settingsService.getSettings();
      res.status(200).json(okResponse(settings, 'Configuración de tienda obtenida'));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
