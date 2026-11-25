import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react';
import { useCategories, useProducts } from '../../shared/api/client';
import { CategoryCircle, CategoryCircleSkeleton } from '../../shared/ui/molecules/CategoryCircle';
import { ProductCard, ProductSkeleton } from '../../shared/ui/molecules/ProductCard';
import { HeroCarousel } from './HeroCarousel';

const GUARANTEES = [
  { Icon: Truck, title: 'Envíos y Retiro en Tienda', sub: 'Despacho nacional y entrega segura con PIN' },
  { Icon: ShieldCheck, title: 'Garantía Directa', sub: 'Respaldo oficial PC TRONIC en cada compra' },
  { Icon: Headphones, title: 'Asesoría Técnica', sub: 'Soporte para armar o actualizar tu equipo' },
  { Icon: CheckCircle2, title: 'Productos Originales', sub: 'Stock verificado en tiempo real con SVA' },
] as const;

function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(12 * 3600 + 36 * 60 + 18);
  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 12 * 3600)), 1000);
    return () => clearInterval(id);
  }, []);
  const hrs = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  return {
    hrs: String(hrs).padStart(2, '0'),
    mins: String(mins).padStart(2, '0'),
    secs: String(secs).padStart(2, '0'),
  };
}

export function HomePage() {
  const categories = useCategories();
  const trending = useProducts('?sort=popular&page_size=5');
  const recommended = useProducts('?sort=bestsellers&page_size=5');
  const timer = useCountdown();

  const recommendedItems = recommended.isFallback
    ? [...recommended.data].reverse().slice(0, 5)
    : recommended.data.slice(0, 5);

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <>
      <HeroCarousel />

      {/* Categorías circulares rápidas */}
      <section className="section section--white">
        <div className="container">
          <div className="cat-circles">
            {categories.loading
              ? Array.from({ length: 8 }, (_, i) => <CategoryCircleSkeleton key={i} />)
              : categories.data.slice(0, 8).map((c) => <CategoryCircle key={c.category_id} category={c} />)}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="section">
        <div className="container">
          <header className="section__head">
            <div>
              <p className="eyebrow">Lo más popular</p>
              <h2>Productos Destacados</h2>
            </div>
            <Link to="/catalogo?sort=popular" className="link-arrow">
              Ver todos <ArrowRight size={15} />
            </Link>
          </header>
          <div className="grid-prods">
            {trending.loading
              ? Array.from({ length: 5 }, (_, i) => <ProductSkeleton key={i} />)
              : trending.data.slice(0, 5).map((p) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Banners Promocionales Divididos (Flash Offers + Nuevos Ingresos) */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container split-promos">
          <div className="promo-banner promo-banner--flash">
            <div>
              <span className="promo-banner__tag" style={{ color: 'var(--color-brand-cyan)' }}>
                <Zap size={14} /> OFERTAS FLASH
              </span>
              <h3 style={{ marginTop: 8 }}>Equipos Tech. Mejores Precios.</h3>
              <p>Aprovecha descuentos por tiempo limitado en almacenamiento, periféricos y monitores.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <Link to="/catalogo?sort=price_asc" className="btn btn--outline-dark btn--pill">
                Comprar Ahora <ArrowRight size={15} />
              </Link>
              <div className="countdown" aria-label="Tiempo restante de oferta">
                <div className="countdown__box"><strong>{timer.hrs}</strong><small>Hrs</small></div>
                <div className="countdown__box"><strong>{timer.mins}</strong><small>Mins</small></div>
                <div className="countdown__box"><strong>{timer.secs}</strong><small>Segs</small></div>
              </div>
            </div>
          </div>

          <div className="promo-banner promo-banner--arrivals">
            <div>
              <span className="promo-banner__tag" style={{ color: 'var(--color-brand-primary)' }}>
                <Sparkles size={14} /> NUEVOS INGRESOS
              </span>
              <h3 style={{ marginTop: 8 }}>Lo Nuevo en PC TRONIC</h3>
              <p>Descubre los lanzamientos recién ingresados a nuestro inventario con garantía directa.</p>
            </div>
            <div>
              <Link to="/catalogo?sort=newest" className="btn btn--dark btn--pill">
                Explorar Ahora <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recomendados / Más Vendidos */}
      <section className="section section--white">
        <div className="container">
          <header className="section__head">
            <div>
              <p className="eyebrow">Selección PC TRONIC</p>
              <h2>Recomendados para Ti</h2>
            </div>
            <Link to="/catalogo?sort=bestsellers" className="link-arrow">
              Ver todos <ArrowRight size={15} />
            </Link>
          </header>
          <div className="grid-prods">
            {recommended.loading
              ? Array.from({ length: 5 }, (_, i) => <ProductSkeleton key={i} />)
              : recommendedItems.map((p) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Garantías */}
      <section className="section">
        <div className="container trust-grid">
          {GUARANTEES.map(({ Icon, title, sub }) => (
            <div key={title} className="trust-card">
              <span className="trust-card__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2} />
              </span>
              <strong>{title}</strong>
              <small>{sub}</small>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Oscuro */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="newsletter-strip">
            <div>
              <h2 style={{ fontSize: '1.5rem' }}>
                Únete a <span className="accent-cyan">PC TRONIC+</span>
              </h2>
              <p>Recibe alertas de nuevos ingresos, bajadas de precio y soporte para tus proyectos tech.</p>
            </div>
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <input
                type="email"
                required
                placeholder="Ingresa tu correo electrónico"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSubscribed(false);
                }}
                aria-label="Correo para novedades"
              />
              <button type="submit" className="btn btn--primary">
                {subscribed ? '¡Suscrito!' : 'Suscribirme'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
