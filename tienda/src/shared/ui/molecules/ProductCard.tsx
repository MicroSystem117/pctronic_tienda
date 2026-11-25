import { Heart, ShoppingCart, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl, useStoreSettings } from '../../api/client';
import type { StoreProductSummary } from '../../api/contracts';
import { useCart } from '../../cart/CartContext';
import { useWishlist } from '../../cart/WishlistContext';

export const money = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(value);

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < full ? 'currentColor' : 'none'}
          strokeWidth={2}
          className={i < full ? 'stars__on' : 'stars__off'}
        />
      ))}
    </span>
  );
}

export function ProductCard({ product }: { product: StoreProductSummary }) {
  const { add } = useCart();
  const { data: settings } = useStoreSettings();
  const { has, toggle } = useWishlist();
  const wished = has(product.product_id);
  const low = product.in_stock && product.stock_quantity <= 5;
  const imgSrc = resolveMediaUrl(product.thumbnail_url, product.category_name);

  return (
    <article className="prod-card">
      <div className="prod-card__media">
        <button
          type="button"
          className={`prod-card__wish ${wished ? 'is-active' : ''}`}
          onClick={() => toggle(product)}
          aria-label={wished ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={wished}
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
        </button>
        <Link to={`/producto/${encodeURIComponent(product.slug)}`} style={{ width: '100%', height: '100%' }}>
          <img src={imgSrc} alt={product.name} loading="lazy" decoding="async" />
        </Link>
        <span className={`prod-card__stock ${!product.in_stock ? 'is-out' : low ? 'is-low' : ''}`}>
          {product.in_stock ? `Stock ${product.stock_quantity}` : 'Agotado'}
        </span>
      </div>

      <div className="prod-card__body">
        <span className="prod-card__meta">
          {product.sku}
          {product.brand ? ` · ${product.brand}` : ''}
        </span>
        <h3 className="prod-card__title">
          <Link to={`/producto/${encodeURIComponent(product.slug)}`}>{product.name}</Link>
        </h3>
        {(product.compatibility_or_model || product.short_description) && (
          <span className="prod-card__sub">
            {product.compatibility_or_model || product.short_description}
          </span>
        )}
        <div className="prod-card__rating">
          <Stars value={product.rating_average} />
          <span className="tabular-nums">({product.rating_count})</span>
        </div>
      </div>

      <div className="prod-card__foot">
        <div className="price-row">
          <div>
            <p className="price">
              {money(product.price, product.currency)}
              {product.compare_at_price && <s>{money(product.compare_at_price, product.currency)}</s>}
            </p>
            {settings?.show_bs_prices && (settings.bcv_rate ?? 0) > 0 && (
              <p className="price-bs">
                Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(product.price * settings.bcv_rate)}
              </p>
            )}
          </div>
          {settings?.cashea_active && (
            <span
              className="badge"
              style={{
                background: '#FEF3C7',
                color: '#92400E',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
              title="Disponible con financiamiento Cashea"
            >
              <Zap size={10} className="text-warning" /> Cashea
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn--primary btn--sm btn--block"
          disabled={!product.in_stock}
          onClick={() => add(product)}
        >
          <ShoppingCart size={14} />
          {product.in_stock ? 'Agregar al carrito' : 'Sin stock'}
        </button>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return <div className="skeleton skeleton--prod" aria-hidden="true" />;
}
