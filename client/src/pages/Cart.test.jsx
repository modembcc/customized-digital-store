import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import Cart from './Cart';
import { CartProvider } from '../context/CartContext';

const productA = { _id: 'a', name: 'Widget', price: 10, imageUrl: 'https://placehold.co/1' };
const productB = { _id: 'b', name: 'Gadget', price: 25, imageUrl: 'https://placehold.co/2' };

function seedCart(items) {
  window.localStorage.setItem('cart', JSON.stringify(items));
}

function renderCart() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <Cart />
      </CartProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
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

  it('disables checkout since it is not implemented yet', () => {
    seedCart([{ product: productA, quantity: 1 }]);

    renderCart();

    expect(screen.getByRole('button', { name: /checkout/i })).toBeDisabled();
  });
});
