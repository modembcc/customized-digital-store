import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { fetchCart, syncCart } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'cart';

function loadInitialItems() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Server items are the base; guest items fold in — sums quantities for a shared
// product, appends guest-only products. The retained product object comes from
// the server's fresher, freshly-populated data; only quantities combine.
function mergeCartItems(guestItems, serverItems) {
  const merged = serverItems.map((item) => ({ ...item }));
  for (const guestItem of guestItems) {
    const existing = merged.find((item) => item.product._id === guestItem.product._id);
    if (existing) {
      existing.quantity += guestItem.quantity;
    } else {
      merged.push({ ...guestItem });
    }
  }
  return merged;
}

function cartReducer(items, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existing = items.find((item) => item.product._id === product._id);
      if (existing) {
        return items.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...items, { product, quantity }];
    }
    case 'REMOVE_ITEM':
      return items.filter((item) => item.product._id !== action.payload.productId);
    case 'SET_QUANTITY':
      // Quantity is clamped to a minimum of 1 — removal only happens via the
      // explicit REMOVE_ITEM action, not by typing a quantity down to 0.
      return items.map((item) =>
        item.product._id === action.payload.productId
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      );
    case 'CLEAR':
      return [];
    case 'HYDRATE':
      return action.payload;
    default:
      return items;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadInitialItems);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Lets the auth-transition effect read the *current* guest cart at the moment
  // of login without depending on `items` directly (which would make it re-run
  // on every mutation, not just on auth transitions).
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const wasAuthenticatedRef = useRef(false);
  // True only after a successful server GET (i.e. a merge attempt completed).
  // Kept separate from isAuthenticated: if the fetch fails, mutations must not
  // sync afterward, or a debounced PUT could clobber the real server cart with
  // an incomplete local array.
  const hydratedRef = useRef(false);

  useEffect(() => {
    // Stop touching localStorage once the server is authoritative.
    if (hydratedRef.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && !wasAuthenticatedRef.current) {
      wasAuthenticatedRef.current = true;
      setLoading(true);
      const guestItems = itemsRef.current;
      fetchCart()
        .then((data) => {
          hydratedRef.current = true;
          dispatch({ type: 'HYDRATE', payload: mergeCartItems(guestItems, data.items) });
          // The debounced sync effect below persists the merge result back to
          // the server — no separate "post-merge save" step needed.
        })
        .catch(() => {
          // Couldn't reach the server — keep showing the guest cart; hydratedRef stays false.
        })
        .finally(() => setLoading(false));
    }

    if (!isAuthenticated && wasAuthenticatedRef.current) {
      wasAuthenticatedRef.current = false;
      hydratedRef.current = false;
      dispatch({ type: 'CLEAR' });
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    const timer = setTimeout(() => {
      syncCart(items).catch(() => {
        // Fire-and-forget, mirrors AuthContext.logout()'s pattern — the next
        // successful mutation resends the full state anyway.
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [items]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      totalPrice,
      loading,
      addItem: (product, quantity = 1) => dispatch({ type: 'ADD_ITEM', payload: { product, quantity } }),
      removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', payload: { productId } }),
      setQuantity: (productId, quantity) =>
        dispatch({ type: 'SET_QUANTITY', payload: { productId, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
    }),
    [items, totalItems, totalPrice, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
