import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  Menu,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  User,
} from 'lucide-react';
import { useCategories, useStoreSettings } from '../../api/client';
import { useCustomerAuth } from '../../auth/CustomerAuthContext';
import { useCart } from '../../cart/CartContext';
import { useWishlist } from '../../cart/WishlistContext';
import { PcTronicLogo } from '../atoms/PcTronicLogo';

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const { user } = useCustomerAuth();
  const { data: categories } = useCategories();
  const { data: settings } = useStoreSettings();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [catsOpen, setCatsOpen] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
  };

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__left">
            <span>Envíos y retiro en tienda {settings.company_name}</span>
            <span className="topbar__sep">|</span>
            <span>Equipos con garantía directa</span>
            <span className="topbar__sep">|</span>
            <span className="topbar__rate">
              <ShieldCheck size={13} /> Respaldo SVA en tiempo real
            </span>
          </div>
          <div className="topbar__right">
            <span className="tabular-nums">RIF: {settings.company_rif}</span>
            <span className="topbar__sep">|</span>
            <Link to="/mis-pedidos" className="topbar__link">
              <PackageSearch size={13} /> Rastrear Pedido
            </Link>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-main">
          <Link to="/" className="brand" aria-label="PC TRONIC, inicio">
            <PcTronicLogo />
          </Link>

          <form className="header-search" onSubmit={handleSearch} role="search">
            <span className="header-search__icon" aria-hidden="true">
              <Search size={17} />
            </span>
            <input
              type="search"
              placeholder="Buscar laptops, SSD, monitores, SKU o marcas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar productos"
            />
            <button type="submit" className="header-search__btn" aria-label="Buscar">
              <Search size={17} />
            </button>
          </form>

          <div className="header-actions">
            <Link to="/mi-cuenta" className="header-action" aria-label="Mi cuenta">
              <User size={19} />
              <span className="header-action__label">
                <small>{user ? 'Hola' : 'Iniciar sesión'}</small>
                {user ? user.full_name.split(' ')[0] : 'Mi Cuenta'}
              </span>
            </Link>

            <Link to="/favoritos" className="header-action" aria-label={`Favoritos (${wishCount})`}>
              <span className="header-action__icon">
                <Heart size={19} />
                {wishCount > 0 && <span className="header-badge">{wishCount}</span>}
              </span>
              <span className="header-action__label">
                <small>Lista</small>
                Favoritos
              </span>
            </Link>

            <button
              type="button"
              className="header-action"
              onClick={() => setOpen(true)}
              aria-label={`Abrir carrito (${count})`}
            >
              <span className="header-action__icon">
                <ShoppingCart size={19} />
                <span className="header-badge">{count}</span>
              </span>
              <span className="header-action__label">
                <small>Tu orden</small>
                Carrito
              </span>
            </button>
          </div>
        </div>

        <nav className="catnav" aria-label="Categorías principales">
          <div className="container catnav__inner">
            <button
              type="button"
              className="catnav__trigger"
              aria-expanded={catsOpen}
              onClick={() => setCatsOpen((o) => !o)}
            >
              <Menu size={16} />
              Todas las Categorías
              <ChevronDown size={14} />
            </button>

            <div className="catnav__list">
              <Link to="/catalogo">Catálogo</Link>
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.category_id}
                  to={`/catalogo?categoria=${encodeURIComponent(cat.slug)}`}
                >
                  {cat.name}
                </Link>
              ))}
              <Link to="/catalogo?sort=bestsellers" className="is-deals">
                Ofertas
              </Link>
            </div>
          </div>

          <div className={`catnav__dropdown ${catsOpen ? 'is-open' : ''}`}>
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                to={`/catalogo?categoria=${encodeURIComponent(cat.slug)}`}
                onClick={() => setCatsOpen(false)}
              >
                <span>{cat.name}</span>
                <small>{cat.active_products_count}</small>
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
