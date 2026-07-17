import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
