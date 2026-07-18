export default function ProductCard({ product, onAddToCart }) {
  const inStock = product.stock > 0;

  function handleAddToCart(event) {
    // ProductCard is often rendered inside a Link (see Home.jsx) — stop the
    // click from also triggering that link's navigation.
    event.preventDefault();
    event.stopPropagation();
    onAddToCart(product);
  }

  return (
    <article className="product-card" data-testid="product-card">
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p className="product-price" data-testid="product-price">
        ${product.price.toFixed(2)}
      </p>
      <p
        className={`product-stock ${inStock ? '' : 'out-of-stock'}`}
        data-testid="product-stock"
      >
        {inStock ? `${product.stock} in stock` : 'Out of stock'}
      </p>
      {onAddToCart && (
        <button type="button" onClick={handleAddToCart} disabled={!inStock}>
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      )}
    </article>
  );
}
