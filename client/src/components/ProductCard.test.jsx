import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProductCard from './ProductCard';

const product = {
  _id: '1',
  name: 'Wireless Headphones',
  description: 'Noise cancelling',
  price: 89.99,
  stock: 5,
  imageUrl: 'https://placehold.co/400x400?text=Headphones',
};

describe('ProductCard', () => {
  it('renders product name, description, and formatted price', () => {
    render(<ProductCard product={product} />);

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Noise cancelling')).toBeInTheDocument();
    expect(screen.getByTestId('product-price')).toHaveTextContent('$89.99');
  });

  it('shows stock count when in stock', () => {
    render(<ProductCard product={product} />);

    expect(screen.getByTestId('product-stock')).toHaveTextContent('5 in stock');
  });

  it('shows out of stock when stock is zero', () => {
    render(<ProductCard product={{ ...product, stock: 0 }} />);

    expect(screen.getByTestId('product-stock')).toHaveTextContent('Out of stock');
  });

  it('does not render an Add to Cart button when onAddToCart is not provided', () => {
    render(<ProductCard product={product} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onAddToCart with the product when the button is clicked', async () => {
    const onAddToCart = vi.fn();
    const user = userEvent.setup();

    render(<ProductCard product={product} onAddToCart={onAddToCart} />);
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(onAddToCart).toHaveBeenCalledWith(product);
  });

  it('disables the Add to Cart button when out of stock', () => {
    const onAddToCart = vi.fn();

    render(<ProductCard product={{ ...product, stock: 0 }} onAddToCart={onAddToCart} />);

    expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled();
  });
});
