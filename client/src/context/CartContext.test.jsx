import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from './CartContext';

const productA = { _id: 'a', name: 'A', price: 10 };
const productB = { _id: 'b', name: 'B', price: 5 };

function CartHarness() {
  const { items, totalItems, totalPrice, addItem, removeItem, setQuantity, clearCart } = useCart();

  return (
    <div>
      <p data-testid="total-items">{totalItems}</p>
      <p data-testid="total-price">{totalPrice}</p>
      <ul>
        {items.map((item) => (
          <li key={item.product._id} data-testid={`item-${item.product._id}`}>
            {item.product.name} x {item.quantity}
          </li>
        ))}
      </ul>
      <button onClick={() => addItem(productA)}>Add A</button>
      <button onClick={() => addItem(productB, 2)}>Add B x2</button>
      <button onClick={() => removeItem('a')}>Remove A</button>
      <button onClick={() => setQuantity('a', 5)}>Set A to 5</button>
      <button onClick={() => setQuantity('a', 0)}>Set A to 0</button>
      <button onClick={clearCart}>Clear</button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <CartHarness />
    </CartProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('CartContext', () => {
  it('starts empty', () => {
    renderCart();

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
  });

  it('adds an item', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 1');
    expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    expect(screen.getByTestId('total-price')).toHaveTextContent('10');
  });

  it('increments quantity when the same product is added again', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Add A'));

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 2');
    expect(screen.getByTestId('total-items')).toHaveTextContent('2');
  });

  it('adds an item with an explicit quantity', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add B x2'));

    expect(screen.getByTestId('item-b')).toHaveTextContent('B x 2');
    expect(screen.getByTestId('total-price')).toHaveTextContent('10');
  });

  it('removes an item', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Remove A'));

    expect(screen.queryByTestId('item-a')).not.toBeInTheDocument();
  });

  it('sets a specific quantity', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Set A to 5'));

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 5');
  });

  it('clamps quantity to a minimum of 1 instead of removing the item', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Set A to 0'));

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 1');
  });

  it('clears the cart', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Add B x2'));
    await user.click(screen.getByText('Clear'));

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
  });

  it('persists items to localStorage', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByText('Add A'));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('cart'));
      expect(stored).toHaveLength(1);
      expect(stored[0].product._id).toBe('a');
      expect(stored[0].quantity).toBe(1);
    });
  });

  it('hydrates initial state from localStorage', () => {
    window.localStorage.setItem('cart', JSON.stringify([{ product: productA, quantity: 3 }]));

    renderCart();

    expect(screen.getByTestId('item-a')).toHaveTextContent('A x 3');
    expect(screen.getByTestId('total-items')).toHaveTextContent('3');
  });

  it('throws when useCart is called outside a CartProvider', () => {
    function Broken() {
      useCart();
      return null;
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Broken />)).toThrow('useCart must be used within a CartProvider');

    consoleSpy.mockRestore();
  });
});
