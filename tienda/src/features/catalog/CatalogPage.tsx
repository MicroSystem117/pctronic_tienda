import { TrendingUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCategories, useProducts, useTrendingSearches } from '../../shared/api/client';
import { ProductCard, ProductSkeleton } from '../../shared/ui/molecules/ProductCard';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Ordenar: Más relevantes' },
  { value: 'bestsellers', label: 'Más vendidos' },
  { value: 'most_searched', label: 'Más buscados' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'newest', label: 'Más recientes' },
] as const;

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const categoria = params.get('categoria') ?? '';
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'popular';
  const inStockOnly = params.get('in_stock') === 'true';

  const qs = new URLSearchParams();
  if (categoria) qs.set('category_slug', categoria);
  if (q) qs.set('q', q);
  if (inStockOnly) qs.set('in_stock', 'true');
  qs.set('sort', sort);
  qs.set('page_size', '24');

  const categories = useCategories();
  const products = useProducts(`?${qs.toString()}`);
  const trending = useTrendingSearches(6);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const items = products.isFallback
    ? products.data
        .filter(
          (p) =>
            (!categoria || categories.data.find((c) => c.slug === categoria)?.category_id === p.category_id) &&
            (!inStockOnly || p.in_stock) &&
            (!q || `${p.name} ${p.sku} ${p.brand ?? ''} ${p.compatibility_or_model ?? ''}`.toLowerCase().includes(q.toLowerCase())),
        )
        .sort((a, b) => {
          if (sort === 'bestsellers') return b.sold_count - a.sold_count;
          if (sort === 'most_searched') return b.search_count - a.search_count;
          if (sort === 'price_asc') return a.price - b.price;
          if (sort === 'price_desc') return b.price - a.price;
          if (sort === 'newest') return b.product_id - a.product_id;
          return b.popularity_score - a.popularity_score;
        })
    : products.data;

  return (
    <section className="section section--page">
      <div className="container">
        <p className="eyebrow">Inventario en Tiempo Real</p>
        <h1 className="page-title">Catálogo PC TRONIC</h1>

        <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            placeholder="Buscar por nombre, SKU, marca o modelo..."
            value={q}
            onChange={(e) => update('q', e.target.value)}
            aria-label="Buscar en el catálogo"
          />
          <div className="filters__row">
            <select value={categoria} onChange={(e) => update('categoria', e.target.value)} aria-label="Filtrar por categoría">
              <option value="">Todas las categorías</option>
              {categories.data.map((c) => (
                <option key={c.category_id} value={c.slug}>
                  {c.name} ({c.active_products_count})
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => update('sort', e.target.value)} aria-label="Ordenar productos">
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => update('in_stock', e.target.checked ? 'true' : '')}
              style={{ width: 'auto' }}
            />
            Mostrar solo productos disponibles en stock
          </label>
        </form>

        {trending.data.length > 0 && (
          <div className="trending-bar" aria-label="Búsquedas populares">
            <span className="trending-bar__label">
              <TrendingUp size={14} /> Tendencias:
            </span>
            {trending.data.map((t) => (
              <button
                key={t.term}
                type="button"
                className={`chip ${q.toLowerCase() === t.term.toLowerCase() ? 'is-active' : ''}`}
                onClick={() => update('q', q.toLowerCase() === t.term.toLowerCase() ? '' : t.term)}
              >
                {t.term}
              </button>
            ))}
          </div>
        )}

        <div className="grid-prods">
          {products.loading
            ? Array.from({ length: 10 }, (_, i) => <ProductSkeleton key={i} />)
            : items.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>

        {!products.loading && items.length === 0 && (
          <div className="panel-card" style={{ textAlign: 'center', marginTop: 24 }}>
            <p className="muted" style={{ margin: '0 0 12px' }}>No encontramos productos con esos filtros.</p>
            <button type="button" className="btn btn--outline" onClick={() => setParams({}, { replace: true })}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
