import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart } from 'lucide-react';
import { resolveMediaUrl, storeApi, useStoreSettings } from '../../shared/api/client';
import type { ProductDetail, ProductVariant } from '../../shared/api/contracts';
import { getMockProductDetail } from '../../shared/api/mock-data';
import { useCart } from '../../shared/cart/CartContext';
import { useWishlist } from '../../shared/cart/WishlistContext';
import { money } from '../../shared/ui/molecules/ProductCard';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { data: settings } = useStoreSettings();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    storeApi
      .productBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setSelectedVariant(p.variants[0] ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        const fallback = getMockProductDetail(slug);
        if (fallback) {
          setProduct(fallback);
          setSelectedVariant(null);
        } else {
          setError(err instanceof Error ? err.message : 'Producto no encontrado');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="section section--page">
        <div className="container">
          <div className="skeleton" style={{ minHeight: 380 }} />
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="section section--page">
        <div className="container">
          <div className="panel-card">
            <h1 className="page-title">Producto no disponible</h1>
            <p className="muted">{error ?? 'No encontramos este producto.'}</p>
            <Link to="/catalogo" className="btn btn--primary">Volver al catálogo</Link>
          </div>
        </div>
      </section>
    );
  }

  const activePrice = selectedVariant?.price && selectedVariant.price > 0 ? selectedVariant.price : product.price;
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock_quantity;
  const available = activeStock > 0;
  const wished = has(product.product_id);
  const imgUrl = resolveMediaUrl(product.images[0]?.image_url ?? product.thumbnail_url, product.category_name);

  const handleAdd = (goCheckout = false) => {
    add({ ...product, price: activePrice, stock_quantity: activeStock, in_stock: available }, qty);
    if (goCheckout) navigate('/checkout');
  };

  return (
    <section className="section section--page">
      <div className="container">
        <Link to="/catalogo" className="link-arrow" style={{ marginBottom: 16 }}>
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>

        <div className="pdp-grid">
          <div className="pdp-media">
            <img src={imgUrl} alt={product.name} />
          </div>

          <div className="panel-card">
            <p className="eyebrow">{product.category_name}</p>
            <h1 className="page-title" style={{ marginBottom: 8 }}>{product.name}</h1>
            <p className="mono muted" style={{ fontSize: '0.8rem', margin: '0 0 16px' }}>
              SKU: {selectedVariant?.sku || product.sku}
              {product.brand ? ` · Marca: ${product.brand}` : ''}
            </p>

            <div style={{ padding: '14px 16px', background: 'var(--color-bg-page)', borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <p className="price" style={{ fontSize: '1.75rem', margin: 0 }}>
                  {money(activePrice, product.currency)}
                  {product.compare_at_price && <s>{money(product.compare_at_price, product.currency)}</s>}
                </p>
                {settings?.show_bs_prices && (settings.bcv_rate ?? 0) > 0 && (
                  <span className="price-bs" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(activePrice * settings.bcv_rate)}
                  </span>
                )}
              </div>
              {settings?.cashea_active && (
                <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                    ⚡ CASHEA DISPONIBLE
                  </span>
                  <span>Pagando con Cashea a tasa oficial</span>
                </div>
              )}
            </div>

            {product.description && <p style={{ margin: '0 0 16px', color: 'var(--color-text)' }}>{product.description}</p>}

            {product.variants.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0 0 8px' }}>Opciones disponibles</p>
                <div className="pay-grid">
                  {product.variants.map((v) => (
                    <button
                      key={v.variant_id}
                      type="button"
                      className={`pay-opt ${selectedVariant?.variant_id === v.variant_id ? 'is-active' : ''}`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {[v.talla, v.color].filter(Boolean).join(' · ') || `Opción ${v.variant_id}`} ({v.stock})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(Math.max(1, activeStock), q + 1))} aria-label="Más">+</button>
              </div>
              <span className="tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 600, color: available ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {available ? `${activeStock} disponibles en inventario` : 'Agotado'}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button type="button" className="btn btn--primary btn--pill" disabled={!available} onClick={() => handleAdd(false)}>
                <ShoppingCart size={16} /> Agregar al carrito
              </button>
              <button type="button" className="btn btn--dark btn--pill" disabled={!available} onClick={() => handleAdd(true)}>
                Comprar ahora
              </button>
              <button
                type="button"
                className="btn btn--outline btn--pill"
                onClick={() => toggle(product)}
                aria-pressed={wished}
              >
                <Heart size={16} fill={wished ? 'var(--color-accent-deals)' : 'none'} color={wished ? 'var(--color-accent-deals)' : 'currentColor'} />
                {wished ? 'Guardado' : 'Favorito'}
              </button>
            </div>

            <table className="specs-table">
              <tbody>
                {Object.entries(product.specs).map(([k, v]) => (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
