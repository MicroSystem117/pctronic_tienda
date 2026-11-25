import type { PaginatedData } from '../../../shared/contracts/api-response.js';
import { normalizeSvaMediaUrl, slugifyText } from '../../../shared/domain/sva-media.js';
import { dbPool } from '../../../shared/infrastructure/database/pool.js';
import { computePopularityScore, normalizeSearchTerm } from '../domain/popularity-score.js';
import type {
  CatalogRepositoryPort,
  CategoryEntity,
  ProductVariantEntity,
  StoreProductDetail,
  StoreProductQuery,
  StoreProductSummary,
  TrendingSearchTerm,
} from '../domain/catalog.repository.js';

interface SvaCategoryRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  active_products_count: number;
}

interface SvaProductRow {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
  talla: string | null;
  color: string | null;
  imagen: string | null;
  precio_usd: number;
  stock_actual: number;
  reserved_qty: number;
  sold_count: number;
  created_at: Date;
}

interface SvaVariantRow {
  id: number;
  talla: string;
  color: string;
  stock: number;
  sku: string | null;
  precio_usd: number | null;
}

const RESERVED_SUBQUERY = `LEFT JOIN (
  SELECT pd.producto_id, COALESCE(SUM(pd.cantidad), 0) AS reserved_qty
    FROM pedidos_detalles pd
    INNER JOIN pedidos pe ON pe.id = pd.pedido_id
   WHERE pe.estado = 'pendiente_verificacion'
   GROUP BY pd.producto_id
) pending_agg ON pending_agg.producto_id = p.id`;

const SOLD_SUBQUERY = `LEFT JOIN (
  SELECT producto_id, SUM(qty) AS sold_count
    FROM (
      SELECT fd.producto_id, fd.cantidad AS qty
        FROM facturas_detalles fd
        INNER JOIN facturas f ON f.id = fd.factura_id
       WHERE f.estado <> 'anulada'
      UNION ALL
      SELECT pd.producto_id, pd.cantidad AS qty
        FROM pedidos_detalles pd
        INNER JOIN pedidos pe ON pe.id = pd.pedido_id
       WHERE pe.estado IN ('pago_aprobado', 'listo_para_retirar', 'en_delivery', 'entregado')
         AND pe.factura_id IS NULL
    ) t
   GROUP BY producto_id
) sales_agg ON sales_agg.producto_id = p.id`;

export class MariaDbCatalogRepository implements CatalogRepositoryPort {
  async listStoreCategories(): Promise<readonly CategoryEntity[]> {
    const rows = (await dbPool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.icono,
              COUNT(p.id) AS active_products_count
         FROM categorias c
         LEFT JOIN productos p ON p.categoria_id = c.id AND p.estado = 'activo'
        WHERE c.estado = 'activo'
        GROUP BY c.id
        ORDER BY active_products_count DESC, c.id ASC`,
    )) as SvaCategoryRow[];

    return rows.map((r, index) => ({
      category_id: Number(r.id),
      name: r.nombre,
      slug: slugifyText(r.nombre),
      subtitle: r.descripcion ? r.descripcion.slice(0, 80) : null,
      description: r.descripcion ?? null,
      icon: r.icono ?? null,
      image_url: null,
      display_order: index + 1,
      active_products_count: Number(r.active_products_count ?? 0),
    }));
  }

  async listStoreProducts(query: StoreProductQuery): Promise<PaginatedData<StoreProductSummary>> {
    const conditions: string[] = ["p.estado = 'activo'"];
    const params: unknown[] = [];

    if (query.q) {
      conditions.push('(p.nombre LIKE ? OR p.codigo LIKE ? OR p.descripcion LIKE ? OR p.talla LIKE ? OR p.color LIKE ?)');
      const like = `%${query.q}%`;
      params.push(like, like, like, like, like);
    }

    if (query.category_slug) {
      const catId = await this.resolveCategoryIdBySlug(query.category_slug);
      if (catId === null) {
        return {
          items: [],
          pagination: { page: query.page, page_size: query.page_size, total_items: 0, total_pages: 1 },
        };
      }
      conditions.push('p.categoria_id = ?');
      params.push(catId);
    }

    if (query.in_stock) {
      conditions.push('GREATEST(0, p.stock_actual - COALESCE(pending_agg.reserved_qty, 0)) > 0');
    }
    if (query.min_price !== undefined) {
      conditions.push('p.precio_usd >= ?');
      params.push(query.min_price);
    }
    if (query.max_price !== undefined) {
      conditions.push('p.precio_usd <= ?');
      params.push(query.max_price);
    }

    const whereClause = conditions.join(' AND ');
    const orderByMap: Record<StoreProductQuery['sort'], string> = {
      featured: '(GREATEST(0, p.stock_actual - COALESCE(pending_agg.reserved_qty, 0)) > 0) DESC, COALESCE(sales_agg.sold_count, 0) DESC, p.id DESC',
      popular: '(GREATEST(0, p.stock_actual - COALESCE(pending_agg.reserved_qty, 0)) > 0) DESC, COALESCE(sales_agg.sold_count, 0) DESC, p.id DESC',
      bestsellers: 'COALESCE(sales_agg.sold_count, 0) DESC, p.stock_actual DESC, p.id DESC',
      most_searched: 'p.stock_actual DESC, p.id DESC',
      price_asc: 'p.precio_usd ASC, p.id DESC',
      price_desc: 'p.precio_usd DESC, p.id DESC',
      newest: 'p.id DESC',
      rating_desc: 'COALESCE(sales_agg.sold_count, 0) DESC, p.id DESC',
    };
    const orderBy = orderByMap[query.sort];
    const offset = (query.page - 1) * query.page_size;

    const countRows = (await dbPool.query(
      `SELECT COUNT(*) AS total
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         ${RESERVED_SUBQUERY}
        WHERE ${whereClause}`,
      params,
    )) as { total: number }[];
    const totalItems = Number(countRows[0]?.total ?? 0);

    const rows = (await dbPool.query(
      `SELECT p.id, p.codigo, p.nombre, p.descripcion, p.categoria_id,
              c.nombre AS categoria_nombre, p.talla, p.color, p.imagen,
              p.precio_usd, p.stock_actual, p.created_at,
              COALESCE(pending_agg.reserved_qty, 0) AS reserved_qty,
              COALESCE(sales_agg.sold_count, 0) AS sold_count
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         ${RESERVED_SUBQUERY}
         ${SOLD_SUBQUERY}
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?`,
      [...params, query.page_size, offset],
    )) as SvaProductRow[];

    const productIds = rows.map((r) => Number(r.id));
    const normalizedTerm = query.page === 1 ? normalizeSearchTerm(query.q) : null;
    if (normalizedTerm) {
      await this.recordSearchSignals(normalizedTerm, productIds);
    }

    const searchCounts = await this.fetchSearchCountsMap(productIds);
    let items = rows.map((r) => this.mapStoreSummary(r, searchCounts.get(Number(r.id)) ?? 0));

    if (query.sort === 'most_searched' || query.sort === 'popular') {
      items = [...items].sort((a, b) =>
        query.sort === 'most_searched'
          ? b.search_count - a.search_count || b.popularity_score - a.popularity_score
          : b.popularity_score - a.popularity_score,
      );
    }

    return {
      items,
      pagination: {
        page: query.page,
        page_size: query.page_size,
        total_items: totalItems,
        total_pages: Math.max(1, Math.ceil(totalItems / query.page_size)),
      },
    };
  }

  async listTrendingSearches(limit: number): Promise<readonly TrendingSearchTerm[]> {
    try {
      const rows = (await dbPool.query(
        `SELECT term, search_count
           FROM product_search_terms
          ORDER BY search_count DESC, last_searched_at DESC
          LIMIT ?`,
        [limit],
      )) as { term: string; search_count: number }[];
      return rows.map((r) => ({
        term: r.term,
        search_count: Number(r.search_count),
      }));
    } catch {
      return [];
    }
  }

  async findStoreProductBySlug(slug: string): Promise<StoreProductDetail | null> {
    const cleaned = slug.trim().toLowerCase();
    let matchedId: number | null = null;

    const idSuffixMatch = cleaned.match(/-(\d+)$/);
    if (/^\d+$/.test(cleaned)) {
      matchedId = Number(cleaned);
    } else if (idSuffixMatch) {
      matchedId = Number(idSuffixMatch[1]);
    }

    if (!matchedId) {
      const candidates = (await dbPool.query(
        `SELECT id, codigo, nombre FROM productos WHERE estado = 'activo'`,
      )) as { id: number; codigo: string; nombre: string }[];

      const found = candidates.find(
        (c) =>
          c.codigo.toLowerCase() === cleaned ||
          slugifyText(c.nombre) === cleaned ||
          `${slugifyText(c.nombre)}-${c.id}` === cleaned,
      );
      if (found) matchedId = Number(found.id);
    }

    if (!matchedId) return null;

    const rows = (await dbPool.query(
      `SELECT p.id, p.codigo, p.nombre, p.descripcion, p.categoria_id,
              c.nombre AS categoria_nombre, p.talla, p.color, p.imagen,
              p.precio_usd, p.stock_actual, p.created_at,
              COALESCE(pending_agg.reserved_qty, 0) AS reserved_qty,
              COALESCE(sales_agg.sold_count, 0) AS sold_count
         FROM productos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         ${RESERVED_SUBQUERY}
         ${SOLD_SUBQUERY}
        WHERE p.id = ? AND p.estado = 'activo'
        LIMIT 1`,
      [matchedId],
    )) as SvaProductRow[];

    const row = rows[0];
    if (!row) return null;

    const searchCounts = await this.fetchSearchCountsMap([Number(row.id)]);
    const summary = this.mapStoreSummary(row, searchCounts.get(Number(row.id)) ?? 0);

    let variants: ProductVariantEntity[] = [];
    try {
      const varRows = (await dbPool.query(
        `SELECT id, talla, color, stock, sku, precio_usd
           FROM producto_variantes
          WHERE producto_id = ?
          ORDER BY id ASC`,
        [row.id],
      )) as SvaVariantRow[];
      variants = varRows.map((v) => ({
        variant_id: Number(v.id),
        talla: v.talla,
        color: v.color,
        stock: Number(v.stock),
        sku: v.sku,
        price: v.precio_usd !== null ? Number(v.precio_usd) : null,
      }));
    } catch {
      variants = [];
    }

    const specs: Record<string, string> = {
      Código: row.codigo,
      Categoría: row.categoria_nombre ?? 'Tecnología',
    };
    if (row.color) specs['Marca / Acabado'] = row.color;
    if (row.talla) specs['Modelo / Especificación'] = row.talla;
    specs['Garantía'] = 'Respaldo directo PC TRONIC';

    const images = summary.thumbnail_url
      ? [
          {
            product_image_id: 1,
            image_url: summary.thumbnail_url,
            image_alt: row.nombre,
            display_order: 1,
            is_primary: true,
          },
        ]
      : [];

    return {
      ...summary,
      description: row.descripcion ?? row.nombre,
      specs,
      variants,
      images,
    };
  }

  private async resolveCategoryIdBySlug(categorySlug: string): Promise<number | null> {
    const rows = (await dbPool.query(
      `SELECT id, nombre FROM categorias WHERE estado = 'activo'`,
    )) as { id: number; nombre: string }[];

    const target = categorySlug.trim().toLowerCase();
    const found = rows.find((r) => slugifyText(r.nombre) === target);
    return found ? Number(found.id) : null;
  }

  private async fetchSearchCountsMap(productIds: readonly number[]): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (productIds.length === 0) return map;

    try {
      const placeholders = productIds.map(() => '?').join(', ');
      const rows = (await dbPool.query(
        `SELECT producto_id, search_count
           FROM product_search_counts
          WHERE producto_id IN (${placeholders})`,
        [...productIds],
      )) as { producto_id: number; search_count: number }[];
      for (const r of rows) {
        map.set(Number(r.producto_id), Number(r.search_count));
      }
    } catch {
      // Degradación elegante si no se ha aplicado la migración auxiliar
    }
    return map;
  }

  private async recordSearchSignals(term: string, productIds: readonly number[]): Promise<void> {
    try {
      await dbPool.query(
        `INSERT INTO product_search_terms (term, search_count)
         VALUES (?, 1)
         ON DUPLICATE KEY UPDATE search_count = search_count + 1, last_searched_at = CURRENT_TIMESTAMP`,
        [term],
      );
      if (productIds.length > 0) {
        const valuesPlaceholders = productIds.map(() => '(?, 1)').join(', ');
        await dbPool.query(
          `INSERT INTO product_search_counts (producto_id, search_count)
           VALUES ${valuesPlaceholders}
           ON DUPLICATE KEY UPDATE search_count = search_count + 1, last_searched_at = CURRENT_TIMESTAMP`,
          [...productIds],
        );
      }
    } catch {
      // Telemetría no bloqueante
    }
  }

  private mapStoreSummary(r: SvaProductRow, searchCount: number): StoreProductSummary {
    const stock = Math.max(0, Number(r.stock_actual) - Number(r.reserved_qty ?? 0));
    const soldCount = Number(r.sold_count ?? 0);
    const inStock = stock > 0;
    const isFeatured = soldCount > 0 || inStock;

    return {
      product_id: Number(r.id),
      sku: r.codigo,
      name: r.nombre,
      slug: `${slugifyText(r.nombre)}-${r.id}`,
      category_id: Number(r.categoria_id ?? 0),
      category_name: r.categoria_nombre ?? 'General',
      brand: r.color || null,
      compatibility_or_model: r.talla || null,
      short_description: r.descripcion ? r.descripcion.slice(0, 140) : r.talla || null,
      price: Number(r.precio_usd),
      compare_at_price: null,
      currency: 'USD',
      stock_quantity: stock,
      in_stock: inStock,
      rating_average: 4.9,
      rating_count: Math.max(1, soldCount),
      thumbnail_url: normalizeSvaMediaUrl(r.imagen),
      is_featured: isFeatured,
      sold_count: soldCount,
      search_count: searchCount,
      popularity_score: computePopularityScore({
        soldCount,
        searchCount,
        ratingAverage: 4.9,
        ratingCount: Math.max(1, soldCount),
        isFeatured,
        inStock,
      }),
    };
  }
}
