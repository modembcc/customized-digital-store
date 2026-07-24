import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Orders from './Orders';

describe('Orders', () => {
  it('shows a placeholder message', () => {
    render(<Orders />);

    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
