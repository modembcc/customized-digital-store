import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import * as api from '../services/api';

const product = { _id: '1', name: 'Widget', price: 9.99 };

function renderHeader() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Header />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Header (logged out)', () => {
  beforeEach(() => {
    vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));
  });

  it('shows a cart count of 0 when the cart is empty', () => {
    renderHeader();

    expect(screen.getByTestId('cart-link')).toHaveTextContent('Cart (0)');
  });

  it('reflects the number of items already in the cart', () => {
    window.localStorage.setItem('cart', JSON.stringify([{ product, quantity: 3 }]));

    renderHeader();

    expect(screen.getByTestId('cart-link')).toHaveTextContent('Cart (3)');
  });

  it('shows Log In / Sign Up links and no Admin link or user info', async () => {
    renderHeader();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
    });
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
  });

  it('links to the store and cart pages', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: /customized digital store/i })).toHaveAttribute('href', '/');
    expect(screen.getByTestId('cart-link')).toHaveAttribute('href', '/cart');
  });
});

describe('Header (logged in as customer)', () => {
  it('shows the user email and Log Out, but no Admin link', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'customer@example.com',
      role: 'customer',
    });

    renderHeader();

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('customer@example.com');
    });
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('reverts to the logged-out nav after clicking Log Out', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'customer@example.com',
      role: 'customer',
    });
    vi.spyOn(api, 'logout').mockResolvedValue({ message: 'Logged out' });
    const user = userEvent.setup();

    renderHeader();
    await waitFor(() => expect(screen.getByTestId('user-email')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    });
    expect(api.logout).toHaveBeenCalled();
  });
});

describe('Header (logged in as admin)', () => {
  it('shows the Admin link', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
    });

    renderHeader();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
    });
  });
});
