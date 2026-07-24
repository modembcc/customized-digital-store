import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { totalItems } = useCart();
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="site-header">
      <nav>
        <Link to="/">Customized Digital Store</Link>
        <Link to="/contact">Contact Us</Link>
        <Link to="/orders">Orders</Link>
        {isAdmin && <Link to="/admin">Admin</Link>}
        {user ? (
          <>
            <span data-testid="user-email">{user.email}</span>
            <button type="button" onClick={logout}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log In</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
        <Link to="/cart" className="cart-link" data-testid="cart-link">
          Cart ({totalItems})
        </Link>
      </nav>
    </header>
  );
}
