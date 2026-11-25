import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/modules/auth/domain/password-hasher.js';
import {
  computePopularityScore,
  normalizeSearchTerm,
} from '../../src/modules/catalog/domain/popularity-score.js';
import { errorResponse, okResponse } from '../../src/shared/contracts/api-response.js';
import { hashRequestPayload } from '../../src/shared/domain/idempotency-hash.js';
import {
  normalizeSvaCtaUrl,
  normalizeSvaMediaUrl,
  slugifyText,
} from '../../src/shared/domain/sva-media.js';

describe('Contrato de Datos Inmutable (API Response)', () => {
  it('construye sobre success estándar', () => {
    const res = okResponse({ order_id: 10 }, 'OK');
    expect(res).toEqual({
      status: 'success',
      data: { order_id: 10 },
      message: 'OK',
    });
  });

  it('construye sobre error estándar con detalles', () => {
    const res = errorResponse('VALIDATION_ERROR', 'Inválido', [
      { field: 'items', issue: 'Requerido' },
    ]);
    expect(res.status).toBe('error');
    expect(res.data.code).toBe('VALIDATION_ERROR');
    expect(res.data.details).toHaveLength(1);
  });
});

describe('Verificación Dual de Contraseñas (Argon2id + PHP bcrypt $2y$)', () => {
  it('verifica hashes Argon2id generados por la tienda', async () => {
    const hash = await hashPassword('PcTronic2026!');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'PcTronic2026!')).toBe(true);
    expect(await verifyPassword(hash, 'otra-clave')).toBe(false);
  });

  it('verifica hashes bcrypt $2y$ generados por sva_online PHP', async () => {
    const raw = await bcrypt.hash('admin123', 10);
    const phpStyleHash = `$2y$${raw.slice(4)}`;
    expect(await verifyPassword(phpStyleHash, 'admin123')).toBe(true);
    expect(await verifyPassword(phpStyleHash, 'wrong')).toBe(false);
  });
});

describe('Normalización de URLs y Slugs SVA', () => {
  it('normaliza rutas de medios subidos desde sva_online', () => {
    expect(normalizeSvaMediaUrl('public/uploads/banners/b1.jpg')).toBe('/sva-media/uploads/banners/b1.jpg');
    expect(normalizeSvaMediaUrl('uploads/productos/p1.png')).toBe('/sva-media/uploads/productos/p1.png');
    expect(normalizeSvaMediaUrl('https://cdn.example.com/a.webp')).toBe('https://cdn.example.com/a.webp');
    expect(normalizeSvaMediaUrl(null)).toBeNull();
  });

  it('normaliza enlaces de botones de banners SVA', () => {
    expect(normalizeSvaCtaUrl('#catalogoGrid')).toBe('/catalogo');
    expect(normalizeSvaCtaUrl('index.php?url=portal&filtro=mas_vendidos')).toBe('/catalogo?sort=bestsellers');
    expect(normalizeSvaCtaUrl('/catalogo?categoria=monitores')).toBe('/catalogo?categoria=monitores');
  });

  it('genera slugs limpios sin acentos', () => {
    expect(slugifyText('Laptops y Portátiles 15.6"')).toBe('laptops-y-portatiles-156');
  });
});

describe('Popularidad e Idempotencia', () => {
  it('calcula score mayor para productos con ventas y stock', () => {
    const hot = computePopularityScore({
      soldCount: 10,
      searchCount: 6,
      ratingAverage: 4.9,
      ratingCount: 10,
      isFeatured: true,
      inStock: true,
    });
    const outOfStock = computePopularityScore({
      soldCount: 10,
      searchCount: 6,
      ratingAverage: 4.9,
      ratingCount: 10,
      isFeatured: true,
      inStock: false,
    });
    expect(hot).toBeGreaterThan(outOfStock);
  });

  it('normaliza términos de búsqueda cortos como null', () => {
    expect(normalizeSearchTerm('a')).toBeNull();
    expect(normalizeSearchTerm('  SSD   NVMe  ')).toBe('ssd nvme');
  });

  it('genera hash SHA-256 determinista para idempotencia', () => {
    const h1 = hashRequestPayload({ product_id: 1, quantity: 2 });
    const h2 = hashRequestPayload({ product_id: 1, quantity: 2 });
    const h3 = hashRequestPayload({ product_id: 1, quantity: 3 });
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).toHaveLength(64);
  });
});
