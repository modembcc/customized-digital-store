import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading products...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (products.length === 0) return <p>No products available.</p>;

  return (
    <section aria-label="Product catalog">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </section>
  );
}
