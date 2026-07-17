import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminProductForm from './AdminProductForm';
import * as api from '../../services/api';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  navigateMock.mockClear();
});

function renderForm(initialEntries = ['/admin/products/new']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/admin/products/new" element={<AdminProductForm />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminProductForm (create mode)', () => {
  it('submits the form and creates a product', async () => {
    vi.spyOn(api, 'createProduct').mockResolvedValue({ _id: '1' });
    const user = userEvent.setup();

    renderForm();

    await user.type(screen.getByLabelText(/name/i), 'New Gadget');
    await user.type(screen.getByLabelText(/description/i), 'A shiny new gadget.');
    await user.type(screen.getByLabelText(/price/i), '29.99');
    await user.type(screen.getByLabelText(/category/i), 'Electronics');
    await user.type(screen.getByLabelText(/sku/i), 'ELEC-099');
    await user.type(screen.getByLabelText(/stock/i), '10');
    await user.click(screen.getByRole('button', { name: /create product/i }));

    await waitFor(() => {
      expect(api.createProduct).toHaveBeenCalledWith({
        name: 'New Gadget',
        description: 'A shiny new gadget.',
        price: 29.99,
        category: 'Electronics',
        sku: 'ELEC-099',
        stock: 10,
      });
    });
    expect(navigateMock).toHaveBeenCalledWith('/admin/products');
  });

  it('shows an error message when creation fails', async () => {
    vi.spyOn(api, 'createProduct').mockRejectedValue(new Error('Duplicate SKU'));
    const user = userEvent.setup();

    renderForm();

    await user.type(screen.getByLabelText(/name/i), 'New Gadget');
    await user.type(screen.getByLabelText(/description/i), 'A shiny new gadget.');
    await user.type(screen.getByLabelText(/price/i), '29.99');
    await user.type(screen.getByLabelText(/category/i), 'Electronics');
    await user.type(screen.getByLabelText(/sku/i), 'ELEC-099');
    await user.type(screen.getByLabelText(/stock/i), '10');
    await user.click(screen.getByRole('button', { name: /create product/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Duplicate SKU');
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

describe('AdminProductForm (edit mode)', () => {
  it('pre-fills the form with the existing product and submits an update', async () => {
    vi.spyOn(api, 'fetchProductById').mockResolvedValue({
      _id: '1',
      name: 'Existing Gadget',
      description: 'Already exists.',
      price: 19.99,
      category: 'Electronics',
      sku: 'ELEC-001',
      stock: 3,
    });
    vi.spyOn(api, 'updateProduct').mockResolvedValue({ _id: '1' });
    const user = userEvent.setup();

    renderForm(['/admin/products/1/edit']);

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Existing Gadget');
    });

    await user.clear(screen.getByLabelText(/stock/i));
    await user.type(screen.getByLabelText(/stock/i), '7');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.updateProduct).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ stock: 7 })
      );
    });
    expect(navigateMock).toHaveBeenCalledWith('/admin/products');
  });
});
