import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CheckoutSuccess from './CheckoutSuccess';
import * as api from '../services/api';

const mockClearCart = vi.fn();

vi.mock('../context/CartContext', () => ({
  useCart: () => ({ clearCart: mockClearCart }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  mockClearCart.mockClear();
});

function renderSuccess(entry = '/checkout/success?orderId=abc') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <CheckoutSuccess />
    </MemoryRouter>
  );
}

const paidOrder = {
  _id: 'abc',
  status: 'paid',
  totalAmount: 20,
  items: [{ product: '1', name: 'Widget', price: 10, quantity: 2 }],
};

describe('CheckoutSuccess', () => {
  it('shows a confirming state before the fetch resolves', () => {
    vi.spyOn(api, 'fetchCheckoutSession').mockReturnValue(new Promise(() => {}));

    renderSuccess();

    expect(screen.getByText(/confirming your payment/i)).toBeInTheDocument();
  });

  it('shows the receipt and clears the cart once the order is paid', async () => {
    vi.spyOn(api, 'fetchCheckoutSession').mockResolvedValue(paidOrder);

    renderSuccess();

    await waitFor(() => {
      expect(screen.getByText(/thank you for your order/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Total: $20.00')).toBeInTheDocument();
    expect(mockClearCart).toHaveBeenCalledTimes(1);
  });

  it('shows a not-confirmed message and does not clear the cart when still pending', async () => {
    vi.spyOn(api, 'fetchCheckoutSession').mockResolvedValue({ ...paidOrder, status: 'pending' });

    renderSuccess();

    await waitFor(() => {
      expect(screen.getByText(/payment not confirmed/i)).toBeInTheDocument();
    });
    expect(mockClearCart).not.toHaveBeenCalled();
  });

  it('shows an error state when the fetch fails', async () => {
    vi.spyOn(api, 'fetchCheckoutSession').mockRejectedValue(new Error('Order not found'));

    renderSuccess();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Order not found');
    });
  });

  it('shows an error state when orderId is missing, without calling the API', async () => {
    vi.spyOn(api, 'fetchCheckoutSession');

    renderSuccess('/checkout/success');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/missing order reference/i);
    });
    expect(api.fetchCheckoutSession).not.toHaveBeenCalled();
  });
});
