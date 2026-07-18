import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import Header from './Header';
import { CartProvider } from '../context/CartContext';

const product = { _id: '1', name: 'Widget', price: 9.99 };

function renderHeader() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <Header />
      </CartProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('Header', () => {
  it('shows a cart count of 0 when the cart is empty', () => {
    renderHeader();

    expect(screen.getByTestId('cart-link')).toHaveTextContent('Cart (0)');
  });

  it('reflects the number of items already in the cart', () => {
    window.localStorage.setItem(
      'cart',
      JSON.stringify([{ product, quantity: 3 }])
    );

    renderHeader();

    expect(screen.getByTestId('cart-link')).toHaveTextContent('Cart (3)');
  });

  it('links to the store, admin, and cart pages', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: /customized digital store/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
    expect(screen.getByTestId('cart-link')).toHaveAttribute('href', '/cart');
  });
});
