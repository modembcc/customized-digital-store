import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header>
      <nav>
        <Link to="/">Store</Link>
        <Link to="/admin">Admin</Link>
      </nav>
    </header>
  );
}
