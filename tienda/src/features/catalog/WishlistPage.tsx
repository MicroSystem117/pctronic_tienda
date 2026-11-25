import { Link } from 'react-router-dom';
import { useWishlist } from '../../shared/cart/WishlistContext';
import { ProductCard } from '../../shared/ui/molecules/ProductCard';

export function WishlistPage() {
  const { items } = useWishlist();

  return (
    <section className="section section--page">
      <div className="container">
        <p className="eyebrow">Guardados</p>
        <h1 className="page-title">Mis Favoritos ({items.length})</h1>

        {items.length === 0 ? (
          <div className="panel-card" style={{ textAlign: 'center' }}>
            <p className="muted" style={{ margin: '0 0 14px' }}>
              Aún no has guardado productos en tu lista de favoritos.
            </p>
            <Link to="/catalogo" className="btn btn--primary btn--pill">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="grid-prods">
            {items.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
