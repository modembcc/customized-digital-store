import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductDetail from './ProductDetail';
import * as api from '../services/api';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

const product = {
  _id: '1',
  name: 'Wireless Headphones',
  description: 'Noise cancelling',
  price: 89.99,
  stock: 5,
  category: 'Electronics',
  imageUrl: 'https://placehold.co/400x400?text=Headphones',
};

function renderDetail(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/products/:id" element={<ProductDetail />} />
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
});

describe('ProductDetail', () => {
  it('renders the product once fetched', async () => {
    vi.spyOn(api, 'fetchProductById').mockResolvedValue(product);

    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    });
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('$89.99')).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', async () => {
    vi.spyOn(api, 'fetchProductById').mockRejectedValue(new Error('Not found'));

    renderDetail('missing');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Not found');
    });
  });

  it('adds the product to the cart when Add to Cart is clicked', async () => {
    vi.spyOn(api, 'fetchProductById').mockResolvedValue(product);
    const user = userEvent.setup();

    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('cart'));
      expect(stored).toHaveLength(1);
      expect(stored[0].product._id).toBe('1');
    });
  });

  it('disables the button when the product is out of stock', async () => {
    vi.spyOn(api, 'fetchProductById').mockResolvedValue({ ...product, stock: 0 });

    renderDetail();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled();
    });
  });
});
