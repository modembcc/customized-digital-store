import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';
import * as api from '../services/api';

afterEach(() => {
  vi.restoreAllMocks();
});

const products = [
  {
    _id: '1',
    name: 'Wireless Headphones',
    description: 'Noise cancelling',
    price: 89.99,
    stock: 5,
    imageUrl: 'https://placehold.co/400x400?text=Headphones',
  },
  {
    _id: '2',
    name: 'Mechanical Keyboard',
    description: 'Hot-swappable',
    price: 129.5,
    stock: 0,
    imageUrl: 'https://placehold.co/400x400?text=Keyboard',
  },
];

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home', () => {
  it('shows a loading state before products arrive', () => {
    vi.spyOn(api, 'fetchProducts').mockReturnValue(new Promise(() => {}));

    renderHome();

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('renders a product card for each fetched product', async () => {
    vi.spyOn(api, 'fetchProducts').mockResolvedValue(products);

    renderHome();

    await waitFor(() => {
      expect(screen.getAllByTestId('product-card')).toHaveLength(2);
    });
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument();
  });

  it('shows an empty state when there are no products', async () => {
    vi.spyOn(api, 'fetchProducts').mockResolvedValue([]);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/no products available/i)).toBeInTheDocument();
    });
  });

  it('shows an error message when the fetch fails', async () => {
    vi.spyOn(api, 'fetchProducts').mockRejectedValue(new Error('Network error'));

    renderHome();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });
});
