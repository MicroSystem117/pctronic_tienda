/**
 * Normaliza rutas de archivos multimedia y enlaces provenientes de sva_online
 * para que la tienda desacoplada pueda consumirlos de forma segura.
 */

export function normalizeSvaMediaUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/media/') ||
    trimmed.startsWith('/sva-media/')
  ) {
    return trimmed;
  }

  const clean = trimmed.replace(/^\/+/, '');
  if (clean.startsWith('public/uploads/')) {
    return `/sva-media/${clean.slice('public/'.length)}`;
  }
  if (clean.startsWith('uploads/')) {
    return `/sva-media/${clean}`;
  }
  return `/${clean}`;
}

export function normalizeSvaCtaUrl(raw: string | null | undefined): string {
  if (!raw) return '/catalogo';
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '#catalogoGrid') return '/catalogo';
  if (trimmed.includes('filtro=mas_vendidos')) return '/catalogo?sort=bestsellers';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return '/catalogo';
}

export function slugifyText(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
