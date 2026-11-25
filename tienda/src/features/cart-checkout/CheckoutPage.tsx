import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ImagePlus,
  Receipt,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { authApi, storeApi, useStoreSettings } from '../../shared/api/client';
import type {
  CreateStoreOrderRequest,
  CreateStoreOrderResponse,
  DeliveryType,
  StoreUser,
} from '../../shared/api/contracts';
import { useCart } from '../../shared/cart/CartContext';
import { money } from '../../shared/ui/molecules/ProductCard';

const moneyBs = (usdValue: number, bcvRate: number) =>
  `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(usdValue * bcvRate)}`;

type CheckoutPaymentMethod = 'pago_movil' | 'transferencia' | 'zelle' | 'binance' | 'efectivo';
const DIGITAL_METHODS: readonly CheckoutPaymentMethod[] = ['pago_movil', 'transferencia', 'zelle', 'binance'];

const PAYMENT_OPTIONS: readonly { readonly value: CheckoutPaymentMethod; readonly label: string }[] = [
  { value: 'pago_movil', label: 'Pago Móvil' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'binance', label: 'Binance Pay' },
  { value: 'efectivo', label: 'Efectivo' },
];

type Step = 1 | 2 | 3;

export function CheckoutPage() {
  const { selectedLines, selectedCount, selectedTotal, clearSelected } = useCart();
  const { data: settings } = useStoreSettings();
  const idempotencyKey = useRef(crypto.randomUUID());

  const [step, setStep] = useState<Step>(1);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [user, setUser] = useState<StoreUser | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('pago_movil');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptData, setReceiptData] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<CreateStoreOrderResponse | null>(null);

  useEffect(() => {
    authApi
      .refresh()
      .then((s) => {
        setUser(s.user);
        setFullName((prev) => prev || s.user.full_name);
        setEmail((prev) => prev || s.user.email);
        setPhone((prev) => prev || s.user.phone || '');
        setAddress((prev) => prev || s.user.shipping_address || '');
        setCity((prev) => prev || s.user.city || '');
        setDocumentId((prev) => prev || s.user.document_id || '');
      })
      .catch(() => undefined);
  }, []);

  if (done) {
    return (
      <section className="section section--page">
        <div className="container narrow">
          <div className="panel-card" style={{ textAlign: 'center', display: 'grid', gap: 14, justifyItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '999px', background: 'rgba(22,163,74,0.12)', color: 'var(--color-success)', display: 'grid', placeItems: 'center' }}>
              <CheckCircle2 size={36} />
            </div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>¡Pedido Registrado en SVA!</h1>
            <p style={{ margin: 0 }}>
              Número de pedido: <strong className="mono accent-blue">{done.order_number}</strong> · Total:{' '}
              <strong className="tabular-nums">{money(done.total_amount, done.currency)}</strong>
            </p>
            <div className="pay-details" style={{ width: '100%', maxWidth: 400 }}>
              <span>Código PIN de entrega segura (6 dígitos):</span>
              <strong className="mono" style={{ fontSize: '1.5rem', letterSpacing: '0.18em', color: 'var(--color-brand-primary)' }}>
                {done.delivery_code}
              </strong>
              <small className="muted">Presenta este código al retirar en tienda o recibir tu delivery.</small>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
              Nuestro equipo verificará tu pago desde SVA y actualizará el estado de tu pedido.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/mis-pedidos" className="btn btn--primary btn--pill">Rastrear mi pedido</Link>
              <Link to="/" className="btn btn--outline btn--pill">Volver a la tienda</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (selectedLines.length === 0) {
    return (
      <section className="section section--page">
        <div className="container narrow">
          <div className="panel-card">
            <h1 className="page-title">Finalizar Pedido</h1>
            <p className="muted">No tienes productos seleccionados en tu carrito.</p>
            <Link to="/carrito" className="btn btn--primary">Ir al carrito</Link>
          </div>
        </div>
      </section>
    );
  }

  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (user) {
        setStep(2);
        return;
      }
      const shipAddress = deliveryType === 'retira_tienda' && !address.trim() ? 'Retiro en tienda física PC TRONIC' : address.trim();
      const shipCity = deliveryType === 'retira_tienda' && !city.trim() ? 'Tienda' : city.trim();

      if (authMode === 'register') {
        const session = await authApi.register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          document_id: documentId.trim() || null,
          shipping_address: shipAddress,
          city: shipCity,
        });
        setUser(session.user);
      } else {
        const session = await authApi.login(email.trim(), password);
        setUser(session.user);
        setFullName(session.user.full_name);
        setEmail(session.user.email);
        setPhone((prev) => prev || session.user.phone || '');
        setAddress((prev) => prev || session.user.shipping_address || '');
        setDocumentId((prev) => prev || session.user.document_id || '');
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el acceso');
    } finally {
      setBusy(false);
    }
  };

  const handleReceiptUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El comprobante debe ser una imagen PNG, JPG o WEBP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar 2 MB');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setReceiptData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const copyValue = (key: string, value: string) => {
    if (!value) return;
    void navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1600);
  };

  const handleStep3Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (DIGITAL_METHODS.includes(paymentMethod) && !paymentReference.trim() && !receiptData) {
      setError('Ingresa el número de referencia o adjunta la captura del comprobante de pago.');
      return;
    }

    setBusy(true);
    const payload: CreateStoreOrderRequest = {
      customer: {
        full_name: (fullName || user?.full_name || '').trim(),
        email: (email || user?.email || '').trim(),
        phone: phone.trim(),
        ...(documentId.trim() ? { document_id: documentId.trim() } : {}),
        shipping_address: deliveryType === 'retira_tienda' && !address.trim() ? 'Retiro en tienda física' : address.trim(),
        city: deliveryType === 'retira_tienda' && !city.trim() ? 'Tienda' : city.trim(),
      },
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      ...(paymentReference.trim() ? { payment_reference: paymentReference.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(receiptData ? { payment_receipt_data: receiptData } : {}),
      items: selectedLines.map((l) => ({
        product_id: l.product.product_id,
        quantity: l.quantity,
      })),
    };

    try {
      const order = await storeApi.createOrder(payload, idempotencyKey.current);
      setDone(order);
      clearSelected();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pedido');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section section--page">
      <div className="container narrow">
        <p className="eyebrow">Checkout Seguro · SVA</p>
        <h1 className="page-title">Finalizar Pedido</h1>

        <ol className="stepper" aria-label="Pasos del checkout">
          <li className={step === 1 ? 'is-active' : step > 1 ? 'is-done' : ''}>
            <span>{step > 1 ? <Check size={13} /> : '1'}</span>
            <strong>Datos y Entrega</strong>
          </li>
          <li className={step === 2 ? 'is-active' : step > 2 ? 'is-done' : ''}>
            <span>{step > 2 ? <Check size={13} /> : '2'}</span>
            <strong>Confirmar Monto</strong>
          </li>
          <li className={step === 3 ? 'is-active' : ''}>
            <span>3</span>
            <strong>Pago y Soporte</strong>
          </li>
        </ol>

        {step === 1 && (
          <form className="panel-card form" onSubmit={handleStep1Submit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={18} /> Paso 1: Cuenta y Entrega
              </h2>
              {!user && (
                <div className="auth-switch" role="tablist">
                  <button type="button" className={authMode === 'register' ? 'is-active' : ''} onClick={() => { setAuthMode('register'); setError(null); }}>
                    Crear cuenta
                  </button>
                  <button type="button" className={authMode === 'login' ? 'is-active' : ''} onClick={() => { setAuthMode('login'); setError(null); }}>
                    Ya tengo cuenta
                  </button>
                </div>
              )}
            </div>

            {user && (
              <div className="pay-details" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{user.full_name}</strong>
                  <div className="muted">{user.email}</div>
                </div>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => { void authApi.logout(); setUser(null); }}>
                  Usar otra cuenta
                </button>
              </div>
            )}

            {!user && authMode === 'register' && (
              <>
                <label>
                  Nombre completo
                  <input required minLength={2} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                </label>
                <div className="grid-2">
                  <label>
                    Correo electrónico
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </label>
                  <label>
                    Contraseña (mín. 6 caracteres)
                    <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  </label>
                </div>
              </>
            )}

            {!user && authMode === 'login' && (
              <div className="grid-2">
                <label>
                  Correo electrónico
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </label>
                <label>
                  Contraseña
                  <input type="password" required minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </label>
              </div>
            )}

            <div className="grid-2">
              <label>
                Teléfono de contacto
                <input type="tel" required minLength={6} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0414-0000000" />
              </label>
              <label>
                Cédula / RIF
                <input value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="V-18234567" />
              </label>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Modalidad de entrega</span>
              <div className="pay-grid">
                <button type="button" className={`pay-opt ${deliveryType === 'delivery' ? 'is-active' : ''}`} onClick={() => setDeliveryType('delivery')}>
                  Delivery / Envío
                </button>
                <button type="button" className={`pay-opt ${deliveryType === 'retira_tienda' ? 'is-active' : ''}`} onClick={() => setDeliveryType('retira_tienda')}>
                  Retira en Tienda
                </button>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div className="grid-2">
                <label>
                  Dirección de envío
                  <input required minLength={4} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. / Calle / Edificio..." />
                </label>
                <label>
                  Ciudad
                  <input required minLength={2} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Valencia / Caracas..." />
                </label>
              </div>
            )}

            {error && <p className="form__error" role="alert">{error}</p>}

            <button type="submit" className="btn btn--primary btn--pill btn--block" disabled={busy}>
              {busy ? 'Procesando…' : 'Continuar a Confirmar Monto →'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="panel-card form">
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={18} /> Paso 2: Confirmar Monto
            </h2>

            <div style={{ display: 'grid', gap: 10 }}>
              {selectedLines.map(({ product, quantity }) => (
                <div key={product.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{product.name}</strong>
                    <div className="mono muted" style={{ fontSize: '0.75rem' }}>{product.sku} · Cant: {quantity}</div>
                  </div>
                  <strong className="tabular-nums">{money(product.price * quantity, product.currency)}</strong>
                </div>
              ))}
            </div>

            <div className="pay-details">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Productos ({selectedCount})</span>
                <strong className="tabular-nums">{money(selectedTotal, settings.currency)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Entrega</span>
                <strong>{deliveryType === 'retira_tienda' ? 'Retiro en tienda física' : `${address}, ${city}`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 4 }}>
                <strong>Total a pagar</strong>
                <div style={{ textAlign: 'right' }}>
                  <strong className="tabular-nums" style={{ fontSize: '1.25rem' }}>{money(selectedTotal, settings.currency)}</strong>
                  {settings.show_bs_prices && (
                    <div className="price-bs">{moneyBs(selectedTotal, settings.bcv_rate)} (BCV: {settings.bcv_rate.toFixed(2)})</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button type="button" className="btn btn--outline" onClick={() => setStep(1)}>
                <ArrowLeft size={15} /> Volver
              </button>
              <button type="button" className="btn btn--primary btn--pill" onClick={() => setStep(3)}>
                Ir a Formas de Pago →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form className="panel-card form" onSubmit={handleStep3Submit}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} /> Paso 3: Formas de Pago
            </h2>

            <div className="pay-details" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Monto confirmado</span>
              <div style={{ textAlign: 'right' }}>
                <strong className="tabular-nums" style={{ fontSize: '1.15rem' }}>{money(selectedTotal, settings.currency)}</strong>
                {settings.show_bs_prices && settings.bcv_rate > 0 && (
                  <div className="price-bs">
                    {moneyBs(selectedTotal, settings.bcv_rate)} (Tasa BCV: {settings.bcv_rate.toFixed(2)})
                  </div>
                )}
              </div>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Método de pago</span>
              <div className="pay-grid">
                {PAYMENT_OPTIONS.filter((opt) => settings.payment_accounts[opt.value]?.enabled ?? true).map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={paymentMethod === m.value}
                    className={`pay-opt ${paymentMethod === m.value ? 'is-active' : ''}`}
                    onClick={() => setPaymentMethod(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {DIGITAL_METHODS.includes(paymentMethod) && (
              <div className="pay-details">
                <strong>Datos para realizar tu pago ({settings.company_name})</strong>
                {paymentMethod === 'pago_movil' && (
                  <ul>
                    <li><span>Banco:</span> <b>{settings.payment_accounts.pago_movil.bank}</b></li>
                    <li>
                      <span>Teléfono:</span> <b>{settings.payment_accounts.pago_movil.phone || '—'}</b>
                      {settings.payment_accounts.pago_movil.phone && (
                        <button type="button" className={`copy-btn ${copiedField === 'pm-t' ? 'is-copied' : ''}`} onClick={() => copyValue('pm-t', settings.payment_accounts.pago_movil.phone)}>
                          {copiedField === 'pm-t' ? <Check size={12} /> : <Copy size={12} />} Copiar
                        </button>
                      )}
                    </li>
                    <li>
                      <span>Cédula / RIF:</span> <b>{settings.payment_accounts.pago_movil.document_id}</b>
                      <button type="button" className={`copy-btn ${copiedField === 'pm-d' ? 'is-copied' : ''}`} onClick={() => copyValue('pm-d', settings.payment_accounts.pago_movil.document_id)}>
                        {copiedField === 'pm-d' ? <Check size={12} /> : <Copy size={12} />} Copiar
                      </button>
                    </li>
                  </ul>
                )}

                {paymentMethod === 'transferencia' && (
                  <ul>
                    <li><span>Banco:</span> <b>{settings.payment_accounts.transferencia.bank}</b></li>
                    <li>
                      <span>Cuenta:</span> <b className="mono">{settings.payment_accounts.transferencia.account_number || '—'}</b>
                      {settings.payment_accounts.transferencia.account_number && (
                        <button type="button" className={`copy-btn ${copiedField === 'tr-c' ? 'is-copied' : ''}`} onClick={() => copyValue('tr-c', settings.payment_accounts.transferencia.account_number)}>
                          {copiedField === 'tr-c' ? <Check size={12} /> : <Copy size={12} />} Copiar
                        </button>
                      )}
                    </li>
                    <li><span>RIF / Titular:</span> <b>{settings.payment_accounts.transferencia.document_id} · {settings.payment_accounts.transferencia.holder_name}</b></li>
                  </ul>
                )}

                {paymentMethod === 'zelle' && (
                  <ul>
                    <li><span>Correo Zelle:</span> <b>{settings.payment_accounts.zelle.email}</b></li>
                    <li><span>Titular:</span> <b>{settings.payment_accounts.zelle.holder_name}</b></li>
                  </ul>
                )}

                {paymentMethod === 'binance' && (
                  <ul>
                    <li><span>Binance Pay ID:</span> <b className="mono">{settings.payment_accounts.binance.pay_id || '—'}</b></li>
                    {settings.payment_accounts.binance.email && (
                      <li><span>Correo:</span> <b>{settings.payment_accounts.binance.email}</b></li>
                    )}
                  </ul>
                )}

                <label style={{ marginTop: 8 }}>
                  Número de referencia bancaria
                  <input
                    maxLength={100}
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ej: 00458912"
                  />
                </label>

                <div style={{ marginTop: 6 }}>
                  <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6 }}>
                    Captura de comprobante (opcional, máx. 2 MB)
                  </span>
                  {receiptData ? (
                    <div className="receipt-preview">
                      <img src={receiptData} alt="Comprobante de pago" />
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => setReceiptData(null)}>
                        <Trash2 size={14} /> Quitar imagen
                      </button>
                    </div>
                  ) : (
                    <label className="receipt-drop">
                      <ImagePlus size={20} />
                      <span>Seleccionar captura del pago (PNG / JPG / WEBP)</span>
                      <input type="file" accept="image/*" onChange={handleReceiptUpload} />
                    </label>
                  )}
                </div>
              </div>
            )}

            <label>
              Notas adicionales (opcional)
              <input
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Horario de entrega, punto de referencia..."
              />
            </label>

            {error && <p className="form__error" role="alert">{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button type="button" className="btn btn--outline" onClick={() => setStep(2)}>
                <ArrowLeft size={15} /> Volver
              </button>
              <button type="submit" className="btn btn--primary btn--pill" disabled={busy}>
                {busy ? 'Registrando pedido…' : 'Confirmar y Enviar Pedido'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
