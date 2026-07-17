export default function ProductCard({ product }) {
  return (
    <article data-testid="product-card">
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p data-testid="product-price">${product.price.toFixed(2)}</p>
      <p data-testid="product-stock">
        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
      </p>
    </article>
  );
}
