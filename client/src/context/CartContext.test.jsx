import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from './CartContext';
import { AuthProvider, useAuth } from './AuthContext';
import * as api from '../services/api';

const productA = { _id: 'a', name: 'A', price: 10 };
const productB = { _id: 'b', name: 'B', price: 5 };

function CartHarness() {
  const { items, totalItems, totalPrice, loading, addItem, removeItem, setQuantity, clearCart } = useCart();

  return (
    <div>
      <p data-testid="total-items">{totalItems}</p>
      <p data-testid="total-price">{totalPrice}</p>
      <p data-testid="cart-loading">{String(loading)}</p>
      <ul>
        {items.map((item) => (
          <li key={item.product._id} data-testid={`item-${item.product._id}`}>
            {item.product.name} x {item.quantity}
          </li>
        ))}
      </ul>
      <button onClick={() => addItem(productA)}>Add A</button>
      <button onClick={() => addItem(productB, 2)}>Add B x2</button>
      <button onClick={() => removeItem('a')}>Remove A</button>
      <button onClick={() => setQuantity('a', 5)}>Set A to 5</button>
      <button onClick={() => setQuantity('a', 0)}>Set A to 0</button>
      <button onClick={clearCart}>Clear</button>
    </div>
  );
}

function AuthControls() {
  const { login, logout } = useAuth();

  return (
    <div>
      <button onClick={() => login({ email: 'user@example.com', password: 'password123' }).catch(() => {})}>
        Auth Login
      </button>
      <button onClick={() => logout()}>Auth Logout</button>
    </div>
  );
}

function renderCart() {
  return render(
    <AuthProvider>
      <CartProvider>
        <AuthControls />
        <CartHarness />
      </CartProvider>
    </AuthProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CartContext (guest)', () => {
  it('starts empty', () => {
    renderCart();

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
  });

  it('adds an item', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 1');
    expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    expect(screen.getByTestId('total-price')).toHaveTextContent('10');
  });

  it('increments quantity when the same product is added again', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Add A'));

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 2');
    expect(screen.getByTestId('total-items')).toHaveTextContent('2');
  });

  it('adds an item with an explicit quantity', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add B x2'));

    expect(screen.getByTestId('item-b')).toHaveTextContent('B x 2');
    expect(screen.getByTestId('total-price')).toHaveTextContent('10');
  });

  it('removes an item', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Remove A'));

    expect(screen.queryByTestId('item-a')).not.toBeInTheDocument();
  });

  it('sets a specific quantity', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Set A to 5'));

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 5');
  });

  it('clamps quantity to a minimum of 1 instead of removing the item', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Set A to 0'));

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 1');
  });

  it('clears the cart', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Add B x2'));
    await user.click(screen.getByText('Clear'));

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
  });

  it('persists items to localStorage', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('cart'));
      expect(stored).toHaveLength(1);
      expect(stored[0].product._id).toBe('a');
      expect(stored[0].quantity).toBe(1);
    });
  });

  it('hydrates initial state from localStorage', () => {
    window.localStorage.setItem('cart', JSON.stringify([{ product: productA, quantity: 3 }]));

    renderCart();

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 3');
    expect(screen.getByTestId('total-items')).toHaveTextContent('3');
  });

  it('never calls fetchCart or syncCart while never authenticated', async () => {
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Remove A'));
    await user.click(screen.getByText('Add B x2'));

    expect(api.fetchCart).not.toHaveBeenCalled();
    expect(api.syncCart).not.toHaveBeenCalled();
  });

  it('throws when useCart is called outside a CartProvider', () => {
    function Broken() {
      useCart();
      return null;
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Broken />)).toThrow('useCart must be used within a CartProvider');

    consoleSpy.mockRestore();
  });
});

describe('CartContext (server sync)', () => {
  it('hydrates from the server when a session already exists on mount', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [{ product: productB, quantity: 4 }] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });

    renderCart();

    await waitFor(() => {
      expect(screen.getByTestId('item-b')).toHaveTextContent('B x 4');
    });
    expect(screen.getByTestId('total-items')).toHaveTextContent('4');
  });

  it('adds a guest-only item to the account cart on login (merge)', async () => {
    window.localStorage.setItem('cart', JSON.stringify([{ product: productA, quantity: 2 }]));
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [{ product: productB, quantity: 3 }] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    const user = userEvent.setup();

    renderCart();
    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 2');

    await user.click(screen.getByText('Auth Login'));

    await waitFor(() => {
      expect(screen.getByTestId('item-b')).toHaveTextContent('B x 3');
    });
    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 2');
  });

  it('sums quantities when the same product exists in both the guest and account cart', async () => {
    window.localStorage.setItem('cart', JSON.stringify([{ product: productA, quantity: 2 }]));
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [{ product: productA, quantity: 3 }] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByText('Auth Login'));

    await waitFor(() => {
      expect(screen.getByTestId('item-a')).toHaveTextContent('A x 5');
    });
    expect(screen.getAllByTestId('item-a')).toHaveLength(1);
  });

  it('shows loading while the fetch is pending without clearing existing guest items', async () => {
    window.localStorage.setItem('cart', JSON.stringify([{ product: productA, quantity: 2 }]));
    let resolveFetch;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockReturnValue(pending);
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByText('Auth Login'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-loading')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 2');

    resolveFetch({ items: [] });

    await waitFor(() => {
      expect(screen.getByTestId('cart-loading')).toHaveTextContent('false');
    });
  });

  it('syncs the merged result back to the server', async () => {
    window.localStorage.setItem('cart', JSON.stringify([{ product: productA, quantity: 2 }]));
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [{ product: productB, quantity: 3 }] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByText('Auth Login'));

    await waitFor(
      () => {
        expect(api.syncCart).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ product: productA, quantity: 2 }),
            expect.objectContaining({ product: productB, quantity: 3 }),
          ])
        );
      },
      { timeout: 2000 }
    );
  });

  it('does not re-merge the same guest snapshot on a subsequent full-page reload', async () => {
    // Regression test: a full-page reload while still authenticated (e.g. every
    // Stripe Checkout redirect round trip, or just hitting refresh) used to
    // re-merge whatever localStorage last held pre-merge, duplicating quantities
    // on every reload since nothing ever cleared that stale snapshot.
    window.localStorage.setItem('cart', JSON.stringify([{ product: productA, quantity: 1 }]));
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    const user = userEvent.setup();

    const { unmount } = renderCart();
    await user.click(screen.getByText('Auth Login'));
    await waitFor(() => expect(screen.getByTestId('item-a')).toHaveTextContent('A x 1'));

    // Simulate the browser tearing down and recreating the whole React tree on
    // a full navigation, with the same authenticated session still active and
    // the server cart now reflecting last render's merge result.
    unmount();
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      role: 'customer',
    });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [{ product: productA, quantity: 1 }] });

    renderCart();

    await waitFor(() => expect(screen.getByTestId('item-a')).toHaveTextContent('A x 1'));
    expect(screen.getByTestId('total-items')).toHaveTextContent('1');
  });

  it('does not write to localStorage while authenticated', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByText('Auth Login'));
    await waitFor(() => expect(screen.getByTestId('cart-loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('Add A'));

    await new Promise((resolve) => setTimeout(resolve, 500));
    // The pre-login guest snapshot (empty, since nothing was seeded) may still be
    // sitting in localStorage — what matters is the authenticated mutation never
    // gets written there.
    expect(JSON.parse(window.localStorage.getItem('cart') || '[]')).toEqual([]);
  });

  it('resets to empty and clears localStorage on logout', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [{ product: productA, quantity: 2 }] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    vi.spyOn(api, 'logout').mockResolvedValue({ message: 'Logged out' });
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByText('Auth Login'));
    await waitFor(() => expect(screen.getByTestId('item-a')).toBeInTheDocument());

    await user.click(screen.getByText('Auth Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('0');
    });
    expect(JSON.parse(window.localStorage.getItem('cart') || '[]')).toEqual([]);
  });

  it('starts a fresh guest cart after logout, unaffected by the previous account cart', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockResolvedValue({ items: [{ product: productA, quantity: 2 }] });
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    vi.spyOn(api, 'logout').mockResolvedValue({ message: 'Logged out' });
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByText('Auth Login'));
    await waitFor(() => expect(screen.getByTestId('item-a')).toBeInTheDocument());
    await user.click(screen.getByText('Auth Logout'));
    await waitFor(() => expect(screen.getByTestId('total-items')).toHaveTextContent('0'));

    await user.click(screen.getByText('Add B x2'));

    expect(screen.getByTestId('item-b')).toHaveTextContent('B x 2');
    expect(screen.queryByTestId('item-a')).not.toBeInTheDocument();
  });

  it('does not sync mutations after a failed hydrate fetch', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    vi.spyOn(api, 'fetchCart').mockRejectedValue(new Error('Network error'));
    vi.spyOn(api, 'syncCart').mockResolvedValue({ items: [] });
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByText('Auth Login'));
    await waitFor(() => expect(screen.getByTestId('cart-loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('Add A'));
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(api.syncCart).not.toHaveBeenCalled();
  });
});
