import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StoreProductSummary } from '../api/contracts';

interface WishlistContextValue {
  readonly items: readonly StoreProductSummary[];
  readonly count: number;
  has: (productId: number) => boolean;
  toggle: (product: StoreProductSummary) => void;
  remove: (productId: number) => void;
}

const STORAGE_KEY = 'pctronic_wishlist_v1';
const WishlistContext = createContext<WishlistContextValue | null>(null);

function loadWishlist(): StoreProductSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoreProductSummary[]) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoreProductSummary[]>(loadWishlist);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin persistencia disponible
    }
  }, [items]);

  const has = (productId: number) => items.some((i) => i.product_id === productId);

  const toggle = (product: StoreProductSummary) => {
    setItems((prev) =>
      prev.some((i) => i.product_id === product.product_id)
        ? prev.filter((i) => i.product_id !== product.product_id)
        : [product, ...prev],
    );
  };

  const remove = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  return (
    <WishlistContext.Provider value={{ items, count: items.length, has, toggle, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist debe usarse dentro de WishlistProvider');
  return ctx;
}
