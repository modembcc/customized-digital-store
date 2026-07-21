import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Local draft state so the field can be freely cleared and retyped instead of
// being immediately snapped back to a clamped value by the controlled value.
function QuantityInput({ product, quantity, onChange }) {
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  function handleChange(event) {
    const raw = event.target.value;
    setDraft(raw);

    const parsed = Number(raw);
    if (raw !== '' && Number.isInteger(parsed) && parsed >= 1) {
      onChange(parsed);
    }
  }

  return (
    <input
      type="number"
      min="1"
      aria-label={`Quantity for ${product.name}`}
      value={draft}
      onChange={handleChange}
    />
  );
}

export default function Cart() {
  const { items, removeItem, setQuantity, clearCart, totalPrice, loading } = useCart();

  if (loading) {
    return (
      <section>
        <h1>Your Cart</h1>
        <p className="loading-state">Loading your cart...</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section>
        <h1>Your Cart</h1>
        <p className="empty-state">
          Your cart is empty. <Link to="/">Browse products</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Your Cart</h1>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ product, quantity }) => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>
                <QuantityInput
                  product={product}
                  quantity={quantity}
                  onChange={(next) => setQuantity(product._id, next)}
                />
              </td>
              <td>${(product.price * quantity).toFixed(2)}</td>
              <td>
                <button type="button" className="danger" onClick={() => removeItem(product._id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cart-total" data-testid="cart-total">
        Total: ${totalPrice.toFixed(2)}
      </p>
      <div className="cart-actions">
        <button type="button" className="secondary" onClick={clearCart}>
          Clear Cart
        </button>
        <button type="button" disabled title="Checkout is not implemented yet">
          Checkout (coming soon)
        </button>
      </div>
    </section>
  );
}
