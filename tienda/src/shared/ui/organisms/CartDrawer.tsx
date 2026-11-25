import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { resolveMediaUrl, useStoreSettings } from '../../api/client';
import { useCart } from '../../cart/CartContext';
import { money } from '../molecules/ProductCard';

export function CartDrawer() {
  const {
    lines,
    selectedCount,
    selectedTotal,
    open,
    setOpen,
    updateQty,
    toggleSelected,
    remove,
  } = useCart();
  const { data: settings } = useStoreSettings();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Carrito de compras">
      <div className="drawer__backdrop" onClick={() => setOpen(false)} />
      <aside className="drawer__panel">
        <div className="drawer__head">
          <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={18} /> Tu Carrito ({selectedCount})
          </h2>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setOpen(false)}
            aria-label="Cerrar carrito"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer__body">
          {lines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p className="muted">Tu carrito está vacío.</p>
              <Link to="/catalogo" className="btn btn--primary btn--sm" onClick={() => setOpen(false)}>
                Explorar catálogo
              </Link>
            </div>
          ) : (
            lines.map(({ product, quantity, selected }) => (
              <div key={product.product_id} className="drawer-line">
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
                />
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: '0.84rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </strong>
                  <div className="tabular-nums" style={{ fontSize: '0.82rem', color: 'var(--color-brand-primary)', fontWeight: 700 }}>
                    {money(product.price * quantity, product.currency)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <div className="qty">
                      <button type="button" onClick={() => updateQty(product.product_id, quantity - 1)} aria-label="Disminuir cantidad">−</button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => updateQty(product.product_id, quantity + 1)} aria-label="Aumentar cantidad">+</button>
                    </div>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => remove(product.product_id)}
                      aria-label={`Quitar ${product.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div className="drawer__foot">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="muted" style={{ fontSize: '0.86rem' }}>Subtotal seleccionado</span>
              <div style={{ textAlign: 'right' }}>
                <strong className="tabular-nums" style={{ fontSize: '1.1rem' }}>
                  {money(selectedTotal, settings.currency)}
                </strong>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Link to="/carrito" className="btn btn--outline" onClick={() => setOpen(false)}>
                Ver carrito
              </Link>
              <Link
                to="/checkout"
                className="btn btn--primary"
                onClick={() => setOpen(false)}
                aria-disabled={selectedCount === 0}
              >
                Pagar ahora
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
