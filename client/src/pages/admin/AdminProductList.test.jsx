import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminProductList from './AdminProductList';
import * as api from '../../services/api';

afterEach(() => {
  vi.restoreAllMocks();
});

const products = [
  {
    _id: '1',
    name: 'Wireless Headphones',
    sku: 'ELEC-001',
    price: 89.99,
    stock: 5,
    isActive: true,
  },
  {
    _id: '2',
    name: 'Discontinued Widget',
    sku: 'OLD-001',
    price: 4.99,
    stock: 0,
    isActive: false,
  },
];

function renderList() {
  return render(
    <MemoryRouter>
      <AdminProductList />
    </MemoryRouter>
  );
}

describe('AdminProductList', () => {
  it('lists all products including inactive ones', async () => {
    vi.spyOn(api, 'fetchAdminProducts').mockResolvedValue(products);

    renderList();

    await waitFor(() => {
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    });
    expect(screen.getByText('Discontinued Widget')).toBeInTheDocument();
  });

  it('removes a product from the list after a successful delete', async () => {
    vi.spyOn(api, 'fetchAdminProducts').mockResolvedValue(products);
    vi.spyOn(api, 'deleteProduct').mockResolvedValue({ message: 'Product deleted' });
    const user = userEvent.setup();

    renderList();

    await waitFor(() => expect(screen.getByText('Wireless Headphones')).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Wireless Headphones')).not.toBeInTheDocument();
    });
    expect(api.deleteProduct).toHaveBeenCalledWith('1');
  });

  it('shows an error message when the fetch fails', async () => {
    vi.spyOn(api, 'fetchAdminProducts').mockRejectedValue(new Error('Server error'));

    renderList();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error');
    });
  });
});
