import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, UserCheck } from 'lucide-react';
import { useCustomerAuth } from '../../shared/auth/CustomerAuthContext';

export function CustomerAccountPage() {
  const { user, loading, login, register, logout } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <section className="section section--page">
        <div className="container narrow">
          <div className="skeleton" style={{ minHeight: 240 }} />
        </div>
      </section>
    );
  }

  if (user) {
    return (
      <section className="section section--page">
        <div className="container narrow">
          <p className="eyebrow">Perfil de Cliente</p>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={26} /> Hola, {user.full_name}
          </h1>
          <div className="panel-card" style={{ display: 'grid', gap: 12 }}>
            <div><strong>Correo:</strong> {user.email}</div>
            {user.phone && <div><strong>Teléfono:</strong> {user.phone}</div>}
            {user.document_id && <div><strong>Cédula / RIF:</strong> {user.document_id}</div>}
            {user.shipping_address && <div><strong>Dirección registrada:</strong> {user.shipping_address}</div>}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
              <Link to="/mis-pedidos" className="btn btn--primary btn--pill">Ver mis pedidos</Link>
              <Link to="/favoritos" className="btn btn--outline btn--pill">Ver mis favoritos</Link>
              <button type="button" className="btn btn--outline btn--pill" onClick={() => void logout()}>
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          document_id: documentId.trim() || null,
          shipping_address: address.trim(),
          city: city.trim(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos autenticar tu cuenta');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section section--page">
      <div className="container narrow">
        <p className="eyebrow">Acceso Clientes</p>
        <h1 className="page-title">Mi Cuenta PC TRONIC</h1>

        <form className="panel-card form" onSubmit={handleSubmit}>
          <div className="auth-switch" style={{ width: 'fit-content' }}>
            <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setError(null); }}>
              Iniciar sesión
            </button>
            <button type="button" className={mode === 'register' ? 'is-active' : ''} onClick={() => { setMode('register'); setError(null); }}>
              Crear cuenta nueva
            </button>
          </div>

          {mode === 'register' && (
            <>
              <label>
                Nombre completo
                <input required minLength={2} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <div className="grid-2">
                <label>
                  Teléfono
                  <input required minLength={6} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label>
                  Cédula / RIF
                  <input value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="V-18234567" />
                </label>
              </div>
              <div className="grid-2">
                <label>
                  Dirección
                  <input required minLength={4} value={address} onChange={(e) => setAddress(e.target.value)} />
                </label>
                <label>
                  Ciudad
                  <input required minLength={2} value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
              </div>
            </>
          )}

          <div className="grid-2">
            <label>
              Correo electrónico
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Contraseña
              <input type="password" required minLength={mode === 'register' ? 6 : 4} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          </div>

          {error && <p className="form__error" role="alert">{error}</p>}

          <button type="submit" className="btn btn--primary btn--pill" disabled={busy}>
            {busy ? 'Procesando…' : mode === 'login' ? 'Entrar a mi cuenta' : 'Registrarme en PC TRONIC'}
          </button>
        </form>
      </div>
    </section>
  );
}
