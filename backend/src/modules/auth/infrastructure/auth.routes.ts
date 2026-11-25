import { Router } from 'express';
import { z } from 'zod';
import { okResponse } from '../../../shared/contracts/api-response.js';
import { UnauthorizedError } from '../../../shared/domain/app-error.js';
import { env } from '../../../shared/infrastructure/config/env.js';
import {
  authenticateJwt,
  validateBody,
} from '../../../shared/infrastructure/http/middlewares.js';
import type { AuthService } from '../application/auth.service.js';

const REFRESH_COOKIE_NAME = 'pctronic_refresh_token';

const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(190),
  password: z.string().min(6).max(128),
  phone: z.string().trim().min(6).max(40),
  document_id: z.string().trim().max(40).nullable().optional().default(null),
  shipping_address: z.string().trim().min(4).max(300),
  city: z.string().trim().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(190),
  password: z.string().min(1).max(128),
});

function setRefreshCookie(res: import('express').Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: env.JWT_REFRESH_TTL_DAYS * 86400 * 1000,
  });
}

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post('/register', validateBody(registerSchema), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof registerSchema>;
      const session = await authService.register({
        ...body,
        userAgent: req.header('user-agent') ?? null,
        ipAddress: req.ip ?? null,
      });

      setRefreshCookie(res, session.refresh_token);
      res.status(201).json(
        okResponse(
          {
            access_token: session.access_token,
            expires_in_seconds: session.expires_in_seconds,
            user: session.user,
          },
          'Cuenta creada e iniciada correctamente',
        ),
      );
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof loginSchema>;
      const session = await authService.login({
        email: body.email,
        password: body.password,
        userAgent: req.header('user-agent') ?? null,
        ipAddress: req.ip ?? null,
      });

      setRefreshCookie(res, session.refresh_token);
      res.status(200).json(
        okResponse(
          {
            access_token: session.access_token,
            expires_in_seconds: session.expires_in_seconds,
            user: session.user,
          },
          'Sesión iniciada correctamente',
        ),
      );
    } catch (err) {
      next(err);
    }
  });

  router.post('/refresh', async (req, res, next) => {
    try {
      const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];
      if (!token) {
        throw new UnauthorizedError('Refresh token no presente');
      }

      const session = await authService.refresh({
        refreshToken: token,
        userAgent: req.header('user-agent') ?? null,
        ipAddress: req.ip ?? null,
      });

      setRefreshCookie(res, session.refresh_token);
      res.status(200).json(
        okResponse(
          {
            access_token: session.access_token,
            expires_in_seconds: session.expires_in_seconds,
            user: session.user,
          },
          'Sesión renovada correctamente',
        ),
      );
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];
      await authService.logout(token);
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'strict',
        path: '/api/v1/auth',
      });
      res.status(200).json(okResponse({ logged_out: true }, 'Sesión cerrada correctamente'));
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', authenticateJwt, async (req, res, next) => {
    try {
      const profile = await authService.getProfile(req.authUser!.user_id);
      res.status(200).json(okResponse(profile, 'Perfil obtenido correctamente'));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
