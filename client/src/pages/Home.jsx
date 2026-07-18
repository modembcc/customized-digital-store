import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/api';
import { useCart } from '../context/CartContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;

    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="loading-state">Loading products...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (products.length === 0) return <p className="empty-state">No products available.</p>;

  return (
    <section aria-label="Product catalog" className="product-grid">
      {products.map((product) => (
        <Link key={product._id} to={`/products/${product._id}`}>
          <ProductCard product={product} onAddToCart={addItem} />
        </Link>
      ))}
    </section>
  );
}
