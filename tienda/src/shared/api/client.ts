import { useEffect, useState } from 'react';
import type {
  ApiResponse,
  CreateStoreOrderRequest,
  CreateStoreOrderResponse,
  ProductDetail,
  RegisterCustomerRequest,
  StoreBanner,
  StoreCategory,
  StoreProductSummary,
  StoreSettings,
  StoreUser,
  TrackedOrderDetail,
  TrendingSearchTerm,
} from './contracts';
import { mockBanners, mockCategories, mockProducts, mockTrendingSearches } from './mock-data';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port, pathname } = window.location;
    // Si se accede vía Nginx (puerto 80, 443 o ruta /tienda), usar el proxy relativo /api/v1
    if (pathname.startsWith('/tienda') || port === '' || port === '80' || port === '443') {
      return '/api/v1';
    }
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3100/api/v1`;
    }
  }
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api/v1';
};

const BASE_URL = getBaseUrl();
export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');
const TIMEOUT_MS = 4500;

export function resolveMediaUrl(url: string | null | undefined, categoryName?: string): string {
  if (url) {
    if (url.startsWith('/sva-media/')) return `${API_ORIGIN}${url}`;
    return url;
  }
  const cat = (categoryName ?? '').toLowerCase();
  if (cat.includes('laptop') || cat.includes('portátil')) return '/media/tech/laptop.svg';
  if (cat.includes('monitor')) return '/media/tech/monitor.svg';
  if (cat.includes('almacenamiento') || cat.includes('ssd')) return '/media/tech/ssd.svg';
  if (cat.includes('gaming') || cat.includes('teclado')) return '/media/tech/keyboard.svg';
  if (cat.includes('audio') || cat.includes('sonido')) return '/media/tech/audio.svg';
  if (cat.includes('redes') || cat.includes('wifi')) return '/media/tech/router.svg';
  if (cat.includes('periférico') || cat.includes('mouse')) return '/media/tech/mouse.svg';
  return '/media/tech/component.svg';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      ...init,
      signal: controller.signal,
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || json.status !== 'success') {
      throw new Error(json.message || `HTTP ${res.status}`);
    }
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

export interface AuthSessionResponse {
  readonly access_token: string;
  readonly expires_in_seconds: number;
  readonly user: StoreUser;
}

export const authApi = {
  register: (payload: RegisterCustomerRequest) =>
    request<AuthSessionResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  login: (email: string, password: string) =>
    request<AuthSessionResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  refresh: () => request<AuthSessionResponse>('/auth/refresh', { method: 'POST' }),
  logout: () => request<{ logged_out: boolean }>('/auth/logout', { method: 'POST' }),
};

export interface Paginated<T> {
  readonly items: readonly T[];
}

export const storeApi = {
  banners: () => request<Paginated<StoreBanner>>('/store/banners'),
  categories: () => request<Paginated<StoreCategory>>('/store/categories'),
  products: (qs: string) => request<Paginated<StoreProductSummary>>(`/store/products${qs}`),
  trendingSearches: (limit = 6) =>
    request<{ items: readonly TrendingSearchTerm[] }>(`/store/trending-searches?limit=${limit}`),
  settings: () => request<StoreSettings>('/store/settings'),
  productBySlug: (slug: string) => request<ProductDetail>(`/store/products/${encodeURIComponent(slug)}`),
  createOrder: (payload: CreateStoreOrderRequest, idempotencyKey: string) =>
    request<CreateStoreOrderResponse>('/store/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    }),
  trackOrder: (orderNumber: string, contact: string) =>
    request<TrackedOrderDetail>(
      `/store/orders/${encodeURIComponent(orderNumber)}?contact=${encodeURIComponent(contact)}`,
    ),
  myOrders: (accessToken: string) =>
    request<{ items: readonly TrackedOrderDetail[] }>('/store/my/orders', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((d) => d.items),
};

export interface RemoteState<T> {
  readonly data: T;
  readonly loading: boolean;
  readonly isFallback: boolean;
}

export function useRemote<T>(load: () => Promise<T>, fallback: T, deps: readonly unknown[]): RemoteState<T> {
  const [state, setState] = useState<RemoteState<T>>({ data: fallback, loading: true, isFallback: false });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    load()
      .then((data) => !cancelled && setState({ data, loading: false, isFallback: false }))
      .catch(() => !cancelled && setState({ data: fallback, loading: false, isFallback: true }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  company_name: 'PC TRONIC TERMINAL CA',
  company_rif: 'J-50157662-9',
  company_phone: '04147694155',
  company_email: 'ventas@pctronic.com.ve',
  company_address: 'C.C Terminal, Av. Sucre, Ciudad Bolívar',
  free_shipping_threshold: 150,
  free_shipping_enabled: true,
  currency: 'USD',
  bcv_rate: 922.56,
  binance_rate: 1200,
  show_bs_prices: true,
  payment_accounts: {
    pago_movil: {
      enabled: true,
      bank: 'Banesco (0134)',
      phone: '04147694155',
      document_id: 'J-50157662-9',
      holder_name: 'PC TRONIC TERMINAL CA',
      instructions: 'Envía el número de referencia junto con la captura.',
    },
    transferencia: {
      enabled: true,
      bank: 'Banesco Banco Universal',
      account_number: '0134-0000-00-0000000000',
      account_type: 'Corriente',
      document_id: 'J-50157662-9',
      holder_name: 'PC TRONIC TERMINAL CA',
      instructions: null,
    },
    zelle: {
      enabled: false,
      email: '',
      holder_name: 'PC TRONIC TERMINAL CA',
      instructions: null,
    },
    binance: {
      enabled: false,
      pay_id: '',
      email: '',
      holder_name: 'PC TRONIC Pay',
      instructions: null,
    },
    efectivo: {
      enabled: true,
      instructions: 'Pago en tienda física o contraentrega.',
    },
  },
};

export const useBanners = () =>
  useRemote(() => storeApi.banners().then((d) => d.items), mockBanners, []);

export const useCategories = () =>
  useRemote(() => storeApi.categories().then((d) => d.items), mockCategories, []);

let cachedSettings: StoreSettings | null = null;
let pendingSettingsPromise: Promise<StoreSettings> | null = null;

function loadSettingsOnce(): Promise<StoreSettings> {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (!pendingSettingsPromise) {
    pendingSettingsPromise = storeApi
      .settings()
      .then((data) => {
        cachedSettings = data;
        return data;
      })
      .catch((err) => {
        cachedSettings = DEFAULT_SETTINGS;
        throw err;
      });
  }
  return pendingSettingsPromise;
}

export const useStoreSettings = () =>
  useRemote(loadSettingsOnce, cachedSettings ?? DEFAULT_SETTINGS, []);

export const useProducts = (qs: string) =>
  useRemote(() => storeApi.products(qs).then((d) => d.items), mockProducts, [qs]);

export const useTrendingSearches = (limit = 6) =>
  useRemote(() => storeApi.trendingSearches(limit).then((d) => d.items), mockTrendingSearches, [limit]);
