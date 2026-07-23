import { Link } from 'react-router-dom';

export default function CheckoutCancel() {
  return (
    <section>
      <h1>Checkout Cancelled</h1>
      <p>Your payment was not completed. Your cart is still saved.</p>
      <Link to="/cart">Back to cart</Link>
    </section>
  );
}
