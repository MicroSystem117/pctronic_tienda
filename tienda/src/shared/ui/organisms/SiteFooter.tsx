import { Link } from 'react-router-dom';
import { useStoreSettings } from '../../api/client';
import { PcTronicLogo } from '../atoms/PcTronicLogo';

export function SiteFooter() {
  const { data: settings } = useStoreSettings();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <PcTronicLogo size="sm" />
            <p className="muted" style={{ fontSize: '0.84rem', marginTop: 12, maxWidth: '34ch' }}>
              Soluciones en computación, hardware, redes y accesorios tecnológicos con inventario real sincronizado a SVA.
            </p>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, marginTop: 8 }}>
              RIF: {settings.company_rif} · {settings.company_phone}
            </p>
          </div>

          <div className="footer-col">
            <h4>Tienda</h4>
            <ul>
              <li><Link to="/catalogo">Todos los productos</Link></li>
              <li><Link to="/categorias">Categorías</Link></li>
              <li><Link to="/catalogo?sort=bestsellers">Más vendidos</Link></li>
              <li><Link to="/favoritos">Mis favoritos</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Soporte y Pedidos</h4>
            <ul>
              <li><Link to="/mis-pedidos">Rastrear mi pedido</Link></li>
              <li><Link to="/carrito">Mi carrito</Link></li>
              <li><Link to="/checkout">Finalizar compra</Link></li>
              <li><Link to="/mi-cuenta">Mi cuenta</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contacto Directo</h4>
            <ul>
              <li><span>{settings.company_address}</span></li>
              <li><a href={`mailto:${settings.company_email}`}>{settings.company_email}</a></li>
              <li><span>{settings.company_phone}</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {settings.company_name}. Todos los derechos reservados.</span>
          <div className="pay-badges" aria-label="Métodos de pago aceptados">
            <span className="pay-badge">Pago Móvil</span>
            <span className="pay-badge">Transferencia</span>
            <span className="pay-badge">Zelle</span>
            <span className="pay-badge">Binance Pay</span>
            <span className="pay-badge">Efectivo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
