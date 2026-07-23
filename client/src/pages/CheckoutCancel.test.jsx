import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CheckoutCancel from './CheckoutCancel';

describe('CheckoutCancel', () => {
  it('shows a cancellation message and a link back to the cart', () => {
    render(
      <MemoryRouter>
        <CheckoutCancel />
      </MemoryRouter>
    );

    expect(screen.getByText(/checkout cancelled/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to cart/i })).toHaveAttribute('href', '/cart');
  });
});
