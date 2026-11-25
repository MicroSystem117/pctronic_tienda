import { normalizeSvaCtaUrl, normalizeSvaMediaUrl } from '../../../shared/domain/sva-media.js';
import { dbPool } from '../../../shared/infrastructure/database/pool.js';
import type { BannerEntity, BannerRepositoryPort } from '../domain/banner.repository.js';

interface SvaBannerRow {
  id: number;
  tag: string | null;
  titulo: string;
  texto_destacado: string | null;
  subtitulo: string | null;
  imagen_url: string | null;
  texto_boton: string | null;
  enlace_url: string | null;
  color_fondo_inicio: string | null;
  color_fondo_fin: string | null;
  gradiente_angulo: number | null;
  orden: number;
}

export class MariaDbBannerRepository implements BannerRepositoryPort {
  async listActiveForStore(channel?: string): Promise<readonly BannerEntity[]> {
    const targetChannel = channel && channel !== 'all' ? channel.trim().toLowerCase() : null;
    const query =
      channel === 'all'
        ? `SELECT id, tag, titulo, texto_destacado, subtitulo, imagen_url,
                  texto_boton, enlace_url, color_fondo_inicio, color_fondo_fin,
                  gradiente_angulo, orden
             FROM banners_carrusel
            WHERE activo = 1
            ORDER BY orden ASC, id ASC`
        : `SELECT id, tag, titulo, texto_destacado, subtitulo, imagen_url,
                  texto_boton, enlace_url, color_fondo_inicio, color_fondo_fin,
                  gradiente_angulo, orden
             FROM banners_carrusel
            WHERE activo = 1 AND (canal = ? OR canal = 'general' OR canal IS NULL)
            ORDER BY orden ASC, id ASC`;

    const params = channel === 'all' ? [] : [targetChannel || 'pctronic'];
    const rows = (await dbPool.query(query, params)) as SvaBannerRow[];

    return rows.map((row) => ({
      banner_id: Number(row.id),
      badge_text: row.tag ?? null,
      title: row.titulo,
      highlight_text: row.texto_destacado ?? null,
      subtitle: row.subtitulo ?? null,
      image_url: normalizeSvaMediaUrl(row.imagen_url) ?? '',
      image_alt: row.titulo,
      cta_label: row.texto_boton || 'Explorar Catálogo',
      cta_url: normalizeSvaCtaUrl(row.enlace_url),
      color_start: row.color_fondo_inicio || '#0b1120',
      color_end: row.color_fondo_fin || '#0369a1',
      gradient_angle: Number(row.gradiente_angulo ?? 135),
      display_order: Number(row.orden),
    }));
  }
}
