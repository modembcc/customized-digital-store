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

  it('shows the existing image as a preview and keeps it when no new image is selected', async () => {
    vi.spyOn(api, 'fetchProductById').mockResolvedValue({
      _id: '1',
      name: 'Existing Gadget',
      description: 'Already exists.',
      price: 19.99,
      category: 'Electronics',
      sku: 'ELEC-001',
      stock: 3,
      imageUrl: '/uploads/existing.png',
    });
    vi.spyOn(api, 'updateProduct').mockResolvedValue({ _id: '1' });
    const user = userEvent.setup();

    renderForm(['/admin/products/1/edit']);

    await waitFor(() => {
      expect(screen.getByAltText(/product preview/i)).toHaveAttribute('src', '/uploads/existing.png');
    });

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.updateProduct).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ imageUrl: '/uploads/existing.png' })
      );
    });
  });
});

describe('AdminProductForm image upload', () => {
  it('uploads the selected image and shows a preview', async () => {
    vi.spyOn(api, 'uploadProductImage').mockResolvedValue({ imageUrl: '/uploads/new-photo.png' });
    const user = userEvent.setup();
    const file = new File(['fake-image-bytes'], 'photo.png', { type: 'image/png' });

    renderForm();
    await user.upload(screen.getByLabelText(/product image/i), file);

    await waitFor(() => {
      expect(screen.getByAltText(/product preview/i)).toHaveAttribute('src', '/uploads/new-photo.png');
    });
    expect(api.uploadProductImage).toHaveBeenCalledWith(file);
  });

  it('shows an error and no preview when the upload fails', async () => {
    vi.spyOn(api, 'uploadProductImage').mockRejectedValue(new Error('File too large'));
    const user = userEvent.setup();
    const file = new File(['fake-image-bytes'], 'huge.png', { type: 'image/png' });

    renderForm();
    await user.upload(screen.getByLabelText(/product image/i), file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('File too large');
    });
    expect(screen.queryByAltText(/product preview/i)).not.toBeInTheDocument();
  });

  it('includes the uploaded image URL in the create payload', async () => {
    vi.spyOn(api, 'uploadProductImage').mockResolvedValue({ imageUrl: '/uploads/new-photo.png' });
    vi.spyOn(api, 'createProduct').mockResolvedValue({ _id: '1' });
    const user = userEvent.setup();
    const file = new File(['fake-image-bytes'], 'photo.png', { type: 'image/png' });

    renderForm();
    await user.upload(screen.getByLabelText(/product image/i), file);
    await waitFor(() => expect(screen.getByAltText(/product preview/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/name/i), 'New Gadget');
    await user.type(screen.getByLabelText(/description/i), 'A shiny new gadget.');
    await user.type(screen.getByLabelText(/price/i), '29.99');
    await user.type(screen.getByLabelText(/category/i), 'Electronics');
    await user.type(screen.getByLabelText(/sku/i), 'ELEC-099');
    await user.type(screen.getByLabelText(/stock/i), '10');
    await user.click(screen.getByRole('button', { name: /create product/i }));

    await waitFor(() => {
      expect(api.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrl: '/uploads/new-photo.png' })
      );
    });
  });
});
