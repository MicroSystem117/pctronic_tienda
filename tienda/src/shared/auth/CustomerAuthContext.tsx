import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/client';
import type { RegisterCustomerRequest, StoreUser } from '../api/contracts';

interface CustomerAuthContextValue {
  readonly user: StoreUser | null;
  readonly accessToken: string | null;
  readonly loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterCustomerRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .refresh()
      .then((s) => {
        setUser(s.user);
        setAccessToken(s.access_token);
      })
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const s = await authApi.login(email, password);
    setUser(s.user);
    setAccessToken(s.access_token);
  };

  const register = async (payload: RegisterCustomerRequest) => {
    const s = await authApi.register(payload);
    setUser(s.user);
    setAccessToken(s.access_token);
  };

  const logout = async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
    setAccessToken(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth debe usarse dentro de CustomerAuthProvider');
  return ctx;
}
