import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AuthService } from './modules/auth/application/auth.service.js';
import { createAuthRouter } from './modules/auth/infrastructure/auth.routes.js';
import { MariaDbAuthRepository } from './modules/auth/infrastructure/mariadb-auth.repository.js';
import { BannerService } from './modules/banners/application/banner.service.js';
import { createStoreBannerRouter } from './modules/banners/infrastructure/banner.routes.js';
import { MariaDbBannerRepository } from './modules/banners/infrastructure/mariadb-banner.repository.js';
import { CatalogService } from './modules/catalog/application/catalog.service.js';
import { createStoreCatalogRouter } from './modules/catalog/infrastructure/catalog.routes.js';
import { MariaDbCatalogRepository } from './modules/catalog/infrastructure/mariadb-catalog.repository.js';
import { createHealthRouter } from './modules/health/infrastructure/health.routes.js';
import { SaleService } from './modules/sales/application/sale.service.js';
import { MariaDbSaleRepository } from './modules/sales/infrastructure/mariadb-sale.repository.js';
import {
  createStoreMyOrdersRouter,
  createStoreOrderRouter,
} from './modules/sales/infrastructure/sale.routes.js';
import { SettingsService } from './modules/settings/application/settings.service.js';
import { MariaDbSettingsRepository } from './modules/settings/infrastructure/mariadb-settings.repository.js';
import { createStoreSettingsRouter } from './modules/settings/infrastructure/settings.routes.js';
import { errorResponse, okResponse } from './shared/contracts/api-response.js';
import { env, svaRootPath } from './shared/infrastructure/config/env.js';
import {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
} from './shared/infrastructure/http/middlewares.js';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (
          !requestOrigin ||
          requestOrigin === env.CORS_TIENDA_ORIGIN ||
          requestOrigin.includes('localhost') ||
          requestOrigin.includes('127.0.0.1') ||
          requestOrigin.includes('192.168.') ||
          requestOrigin.includes('100.')
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
    }),
  );
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: errorResponse('RATE_LIMIT_EXCEEDED', 'Demasiadas peticiones, intenta nuevamente'),
    }),
  );

  app.use(express.json({ limit: '4mb' }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  const authService = new AuthService(new MariaDbAuthRepository());
  const bannerService = new BannerService(new MariaDbBannerRepository());
  const catalogService = new CatalogService(new MariaDbCatalogRepository());
  const saleService = new SaleService(new MariaDbSaleRepository());
  const settingsService = new SettingsService(new MariaDbSettingsRepository());

  app.get('/', (_req, res) => {
    res.status(200).json(
      okResponse(
        {
          name: 'PC TRONIC · Tienda Online API (Integrada con SVA CRM)',
          version: 'v1',
          health: { live: '/health/live', ready: '/health/ready' },
          endpoints: { auth: '/api/v1/auth', store: '/api/v1/store' },
        },
        'API REST operativa',
      ),
    );
  });

  // Exposición segura en solo lectura de imágenes subidas desde sva_online (productos y banners)
  app.use('/sva-media/uploads', express.static(path.join(svaRootPath, 'public', 'uploads')));
  app.use('/sva-media/uploads', express.static(path.join(svaRootPath, 'uploads')));

  app.use('/health', createHealthRouter());

  const apiV1 = Router();
  apiV1.use('/auth', createAuthRouter(authService));

  const storeRouter = Router();
  storeRouter.use('/banners', createStoreBannerRouter(bannerService));
  storeRouter.use('/settings', createStoreSettingsRouter(settingsService));
  storeRouter.use('/', createStoreCatalogRouter(catalogService));
  storeRouter.use('/orders', createStoreOrderRouter(saleService));
  storeRouter.use('/my', createStoreMyOrdersRouter(saleService));
  apiV1.use('/store', storeRouter);

  app.use('/api/v1', apiV1);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
