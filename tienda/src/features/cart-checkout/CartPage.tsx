import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { resolveMediaUrl, useStoreSettings } from '../../shared/api/client';
import { useCart } from '../../shared/cart/CartContext';
import { money } from '../../shared/ui/molecules/ProductCard';

export function CartPage() {
  const {
    lines,
    selectedCount,
    selectedTotal,
    updateQty,
    toggleSelected,
    toggleAllSelected,
    remove,
    clear,
  } = useCart();
  const { data: settings } = useStoreSettings();
  const allSelected = lines.length > 0 && lines.every((l) => l.selected);

  return (
    <section className="section section--page">
      <div className="container narrow">
        <p className="eyebrow">Tu orden PC TRONIC</p>
        <h1 className="page-title">Carrito de Compras</h1>

        {lines.length === 0 ? (
          <div className="panel-card" style={{ textAlign: 'center' }}>
            <p className="muted" style={{ margin: '0 0 14px' }}>No tienes productos en tu carrito.</p>
            <Link to="/catalogo" className="btn btn--primary btn--pill">Ir al catálogo</Link>
          </div>
        ) : (
          <div className="panel-card" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAllSelected(e.target.checked)}
                />
                Seleccionar todos ({lines.length})
              </label>
              <button type="button" className="btn btn--outline btn--sm" onClick={clear}>
                Vaciar carrito
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {lines.map(({ product, quantity, selected }) => (
                <div key={product.product_id} className="drawer-line" style={{ gridTemplateColumns: 'auto 72px 1fr auto' }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelected(product.product_id)}
                    aria-label={`Seleccionar ${product.name}`}
                  />
                  <img
                    src={resolveMediaUrl(product.thumbnail_url, product.category_name)}
                    alt={product.name}
                    className="drawer-line__img"
                    style={{ width: 72, height: 56 }}
                  />
                  <div>
                    <Link to={`/producto/${encodeURIComponent(product.slug)}`} style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {product.name}
                    </Link>
                    <div className="mono muted" style={{ fontSize: '0.75rem' }}>{product.sku}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <div className="qty">
                        <button type="button" onClick={() => updateQty(product.product_id, quantity - 1)}>−</button>
                        <span>{quantity}</span>
                        <button type="button" onClick={() => updateQty(product.product_id, quantity + 1)}>+</button>
                      </div>
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => remove(product.product_id)} aria-label="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong className="tabular-nums">{money(product.price * quantity, product.currency)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span className="muted" style={{ fontSize: '0.85rem' }}>Total seleccionado ({selectedCount} unidades)</span>
                <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {money(selectedTotal, settings.currency)}
                </div>
              </div>

              {selectedCount > 0 ? (
                <Link to="/checkout" className="btn btn--primary btn--pill">
                  Continuar al Checkout →
                </Link>
              ) : (
                <button type="button" className="btn btn--primary btn--pill" disabled>
                  Selecciona al menos 1 producto
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
