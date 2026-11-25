import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { CustomerAuthProvider } from '../shared/auth/CustomerAuthContext';
import { CartProvider } from '../shared/cart/CartContext';
import { WishlistProvider } from '../shared/cart/WishlistContext';
import { CartDrawer } from '../shared/ui/organisms/CartDrawer';
import { SiteFooter } from '../shared/ui/organisms/SiteFooter';
import { SiteHeader } from '../shared/ui/organisms/SiteHeader';
import { CustomerAccountPage } from '../features/account/CustomerAccountPage';
import { CartPage } from '../features/cart-checkout/CartPage';
import { CheckoutPage } from '../features/cart-checkout/CheckoutPage';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { WishlistPage } from '../features/catalog/WishlistPage';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { HomePage } from '../features/home/HomePage';
import { OrderTrackingPage } from '../features/orders/OrderTrackingPage';
import { ProductDetailPage } from '../features/product-detail/ProductDetailPage';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ScrollTop />
          <SiteHeader />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/producto/:slug" element={<ProductDetailPage />} />
              <Route path="/favoritos" element={<WishlistPage />} />
              <Route path="/carrito" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/mis-pedidos" element={<OrderTrackingPage />} />
              <Route path="/mi-cuenta" element={<CustomerAccountPage />} />
              <Route
                path="*"
                element={
                  <section className="section section--page">
                    <div className="container narrow">
                      <div className="panel-card" style={{ textAlign: 'center' }}>
                        <h1 className="page-title">Página no encontrada</h1>
                        <Link to="/" className="btn btn--primary btn--pill">Volver al inicio</Link>
                      </div>
                    </div>
                  </section>
                }
              />
            </Routes>
          </main>
          <SiteFooter />
          <CartDrawer />
        </WishlistProvider>
      </CartProvider>
    </CustomerAuthProvider>
  );
}
