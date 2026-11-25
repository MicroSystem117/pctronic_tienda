import { useEffect, useState, type FormEvent } from 'react';
import { PackageCheck, Search } from 'lucide-react';
import { storeApi } from '../../shared/api/client';
import type { SvaOrderStatus, TrackedOrderDetail } from '../../shared/api/contracts';
import { useCustomerAuth } from '../../shared/auth/CustomerAuthContext';
import { money } from '../../shared/ui/molecules/ProductCard';

const STATUS_LABELS: Record<SvaOrderStatus, { label: string; color: string }> = {
  pendiente_verificacion: { label: 'Pago en verificación', color: 'var(--color-warning)' },
  pago_aprobado: { label: 'Pago aprobado', color: 'var(--color-brand-primary)' },
  listo_para_retirar: { label: 'Listo para retirar en tienda', color: 'var(--color-brand-primary)' },
  en_delivery: { label: 'En camino con delivery', color: 'var(--color-brand-sky)' },
  entregado: { label: 'Entregado', color: 'var(--color-success)' },
  rechazado: { label: 'Pago rechazado', color: 'var(--color-danger)' },
};

function OrderCard({ order }: { order: TrackedOrderDetail }) {
  const st = STATUS_LABELS[order.order_status] ?? { label: order.order_status, color: 'var(--color-text)' };
  return (
    <div className="panel-card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <strong className="mono" style={{ fontSize: '1.05rem' }}>{order.order_number}</strong>
          <div className="muted" style={{ fontSize: '0.8rem' }}>
            {new Date(order.created_at).toLocaleString('es-VE')} · {order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro en tienda'}
          </div>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, border: `1px solid ${st.color}`, color: st.color }}>
          {st.label}
        </span>
      </div>

      {order.delivery_code && order.order_status !== 'entregado' && order.order_status !== 'rechazado' && (
        <div className="pay-details" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span>Código PIN de entrega segura:</span>
          <strong className="mono" style={{ fontSize: '1.2rem', letterSpacing: '0.15em', color: 'var(--color-brand-primary)' }}>
            {order.delivery_code}
          </strong>
        </div>
      )}

      {order.courier_name && (
        <div className="muted" style={{ fontSize: '0.85rem' }}>
          Repartidor asignado: <strong>{order.courier_name}</strong> {order.courier_phone ? `(${order.courier_phone})` : ''}
        </div>
      )}

      {order.rejection_reason && (
        <p className="form__error">Motivo: {order.rejection_reason}</p>
      )}

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, display: 'grid', gap: 6 }}>
        {order.items.map((item) => (
          <div key={`${item.product_id}-${item.sku}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
            <span>{item.quantity} × {item.product_name}</span>
            <strong className="tabular-nums">{money(item.line_total, order.currency)}</strong>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 8, marginTop: 4 }}>
          <strong>Total</strong>
          <strong className="tabular-nums">{money(order.total_amount, order.currency)}</strong>
        </div>
      </div>
    </div>
  );
}

export function OrderTrackingPage() {
  const { user, accessToken } = useCustomerAuth();
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [tracked, setTracked] = useState<TrackedOrderDetail | null>(null);
  const [myOrders, setMyOrders] = useState<readonly TrackedOrderDetail[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setMyOrders([]);
      return;
    }
    storeApi.myOrders(accessToken).then(setMyOrders).catch(() => setMyOrders([]));
  }, [accessToken]);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await storeApi.trackOrder(orderNumber.trim(), contact.trim());
      setTracked(data);
    } catch (err) {
      setTracked(null);
      setError(err instanceof Error ? err.message : 'No encontramos ese pedido');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section section--page">
      <div className="container narrow" style={{ display: 'grid', gap: 20 }}>
        <div>
          <p className="eyebrow">Seguimiento en Vivo · SVA</p>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PackageCheck size={28} /> Rastrear Mi Pedido
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Consulta el estatus actualizado directamente desde nuestro sistema de ventas y despacho SVA.
          </p>
        </div>

        <form className="panel-card form" onSubmit={handleTrack}>
          <div className="grid-2">
            <label>
              Número de Pedido
              <input required placeholder="Ej. PED-00001" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
            </label>
            <label>
              Correo o Teléfono del titular
              <input required placeholder="correo@ejemplo.com o 0414..." value={contact} onChange={(e) => setContact(e.target.value)} />
            </label>
          </div>
          {error && <p className="form__error" role="alert">{error}</p>}
          <button type="submit" className="btn btn--primary btn--pill" disabled={busy}>
            <Search size={15} /> {busy ? 'Buscando…' : 'Consultar estado del pedido'}
          </button>
        </form>

        {tracked && <OrderCard order={tracked} />}

        {user && myOrders.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ fontSize: '1.2rem' }}>Historial de {user.full_name}</h2>
            {myOrders.map((o) => <OrderCard key={o.order_id} order={o} />)}
          </div>
        )}
      </div>
    </section>
  );
}
