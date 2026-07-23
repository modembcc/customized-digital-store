import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCheckoutSession } from '../services/api';
import { useCart } from '../context/CartContext';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCart();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError('Missing order reference.');
      return;
    }

    let cancelled = false;

    fetchCheckoutSession(orderId)
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        if (data.status === 'paid') clearCart();
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (error) {
    return (
      <section>
        <h1>Checkout</h1>
        <p role="alert">{error}</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section>
        <h1>Checkout</h1>
        <p className="loading-state">Confirming your payment...</p>
      </section>
    );
  }

  if (order.status !== 'paid') {
    return (
      <section>
        <h1>Payment Not Confirmed</h1>
        <p>
          We couldn&apos;t confirm your payment yet. If you completed payment, this may take a
          moment — refresh to check again.
        </p>
        <Link to="/cart">Back to cart</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Thank you for your order!</h1>
      <p>Your payment was confirmed.</p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.product}>
              <td>{item.name}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>{item.quantity}</td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cart-total">Total: ${order.totalAmount.toFixed(2)}</p>
      <Link to="/">Continue shopping</Link>
    </section>
  );
}
