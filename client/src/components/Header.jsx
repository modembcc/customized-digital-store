import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="site-header">
      <nav>
        <Link to="/">Customized Digital Store</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/cart" className="cart-link" data-testid="cart-link">
          Cart ({totalItems})
        </Link>
      </nav>
    </header>
  );
}
