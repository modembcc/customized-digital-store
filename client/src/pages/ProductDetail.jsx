import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProductById } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;

    fetchProductById(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <p role="alert">{error}</p>;
  if (!product) return <p className="loading-state">Loading product...</p>;

  return (
    <article className="product-detail">
      <img src={product.imageUrl} alt={product.name} />
      <div className="product-detail-info">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p className="product-detail-price">${product.price.toFixed(2)}</p>
        <span className="category-tag">{product.category}</span>
        <div className="add-to-cart-row">
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => addItem(product)}
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </article>
  );
}
