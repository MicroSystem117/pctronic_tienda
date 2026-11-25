import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StoreProductSummary } from '../api/contracts';

export interface CartLine {
  readonly product: StoreProductSummary;
  readonly quantity: number;
  readonly selected: boolean;
}

interface CartContextValue {
  readonly lines: readonly CartLine[];
  readonly selectedLines: readonly CartLine[];
  readonly count: number;
  readonly selectedCount: number;
  readonly total: number;
  readonly selectedTotal: number;
  readonly open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: StoreProductSummary, qty?: number) => void;
  updateQty: (productId: number, qty: number) => void;
  toggleSelected: (productId: number) => void;
  toggleAllSelected: (selected: boolean) => void;
  remove: (productId: number) => void;
  clear: () => void;
  clearSelected: () => void;
}

const STORAGE_KEY = 'pctronic_cart_v1';
const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<CartLine>[]) : [];
    return parsed
      .filter((l): l is Partial<CartLine> & { product: StoreProductSummary; quantity: number } =>
        Boolean(l.product && typeof l.quantity === 'number'),
      )
      .map((l) => ({
        product: l.product,
        quantity: l.quantity,
        selected: l.selected ?? true,
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Sin persistencia disponible
    }
  }, [lines]);

  const add = (product: StoreProductSummary, qty = 1) => {
    if (!product.in_stock || product.stock_quantity <= 0) return;
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product.product_id === product.product_id);
      if (idx >= 0) {
        return prev.map((l, i) =>
          i === idx
            ? { ...l, selected: true, quantity: Math.min(l.quantity + qty, product.stock_quantity) }
            : l,
        );
      }
      return [...prev, { product, quantity: Math.min(qty, product.stock_quantity), selected: true }];
    });
    setOpen(true);
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setLines((prev) => prev.filter((l) => l.product.product_id !== productId));
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.product.product_id === productId
          ? { ...l, quantity: Math.min(qty, Math.max(1, l.product.stock_quantity)) }
          : l,
      ),
    );
  };

  const toggleSelected = (productId: number) => {
    setLines((prev) =>
      prev.map((l) => (l.product.product_id === productId ? { ...l, selected: !l.selected } : l)),
    );
  };

  const toggleAllSelected = (selected: boolean) => {
    setLines((prev) => prev.map((l) => ({ ...l, selected })));
  };

  const remove = (productId: number) => {
    setLines((prev) => prev.filter((l) => l.product.product_id !== productId));
  };

  const clear = () => setLines([]);
  const clearSelected = () => setLines((prev) => prev.filter((l) => !l.selected));

  const selectedLines = lines.filter((l) => l.selected);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const selectedCount = selectedLines.reduce((sum, l) => sum + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const selectedTotal = selectedLines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        lines,
        selectedLines,
        count,
        selectedCount,
        total,
        selectedTotal,
        open,
        setOpen,
        add,
        updateQty,
        toggleSelected,
        toggleAllSelected,
        remove,
        clear,
        clearSelected,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
