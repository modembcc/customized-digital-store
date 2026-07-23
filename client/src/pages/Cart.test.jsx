import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Cart from './Cart';
import * as api from '../services/api';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

const productA = { _id: 'a', name: 'Widget', price: 10, imageUrl: 'https://placehold.co/1' };
const productB = { _id: 'b', name: 'Gadget', price: 25, imageUrl: 'https://placehold.co/2' };

function seedCart(items) {
  window.localStorage.setItem('cart', JSON.stringify(items));
}

function renderCart() {
  return render(
    <MemoryRouter initialEntries={['/cart']}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<p>Login page</p>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Cart', () => {
  it('shows an empty state with a link back to the store', () => {
    renderCart();

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse products/i })).toHaveAttribute('href', '/');
  });

  it('lists cart items with subtotal and total', () => {
    seedCart([
      { product: productA, quantity: 2 },
      { product: productB, quantity: 1 },
    ]);

    renderCart();

    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Gadget')).toBeInTheDocument();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('Total: $45.00');
  });

  it('updates the subtotal and total when quantity changes', async () => {
    seedCart([{ product: productA, quantity: 1 }]);
    const user = userEvent.setup();

    renderCart();
    const quantityInput = screen.getByLabelText(/quantity for widget/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '4');

    await waitFor(() => {
      expect(screen.getByTestId('cart-total')).toHaveTextContent('Total: $40.00');
    });
  });

  it('removes an item from the cart', async () => {
    seedCart([
      { product: productA, quantity: 1 },
      { product: productB, quantity: 1 },
    ]);
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0]);

    await waitFor(() => {
      expect(screen.queryByText('Widget')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Gadget')).toBeInTheDocument();
  });

  it('clears the whole cart', async () => {
    seedCart([{ product: productA, quantity: 1 }]);
    const user = userEvent.setup();

    renderCart();
    await user.click(screen.getByRole('button', { name: /clear cart/i }));

    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });

  describe('checkout', () => {
    it('redirects to login when not authenticated', async () => {
      vi.spyOn(api, 'createCheckoutSession');
      seedCart([{ product: productA, quantity: 1 }]);
      const user = userEvent.setup();

      renderCart();
      await user.click(screen.getByRole('button', { name: /checkout/i }));

      await waitFor(() => {
        expect(screen.getByText('Login page')).toBeInTheDocument();
      });
      expect(api.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('redirects to the Stripe Checkout url when authenticated', async () => {
      vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: 'customer',
      });
      vi.spyOn(api, 'createCheckoutSession').mockResolvedValue({
        url: 'https://checkout.stripe.com/sess_123',
      });
      // jsdom's window.location.assign isn't configurable, so it can't be spied
      // directly — stub the whole global instead.
      const assignMock = vi.fn();
      vi.stubGlobal('location', { ...window.location, assign: assignMock });
      seedCart([{ product: productA, quantity: 1 }]);
      const user = userEvent.setup();

      renderCart();
      await waitFor(() => expect(screen.getByText('Widget')).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: /checkout/i }));

      await waitFor(() => {
        expect(assignMock).toHaveBeenCalledWith('https://checkout.stripe.com/sess_123');
      });
    });

    it('shows an error and re-enables the button when creating the session fails', async () => {
      vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
        id: '1',
        email: 'user@example.com',
        role: 'customer',
      });
      vi.spyOn(api, 'createCheckoutSession').mockRejectedValue(new Error('Your cart is empty'));
      seedCart([{ product: productA, quantity: 1 }]);
      const user = userEvent.setup();

      renderCart();
      await waitFor(() => expect(screen.getByText('Widget')).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: /checkout/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Your cart is empty');
      });
      expect(screen.getByRole('button', { name: /^checkout$/i })).not.toBeDisabled();
    });
  });
});
