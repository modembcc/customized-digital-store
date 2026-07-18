import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminProducts, deleteProduct } from '../../services/api';

export default function AdminProductList() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  function loadProducts() {
    setLoading(true);
    fetchAdminProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleDelete(id) {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="loading-state">Loading products...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Products</h1>
        <Link className="button" to="/admin/products/new">
          Add Product
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>{product.stock}</td>
              <td>{product.isActive ? 'Yes' : 'No'}</td>
              <td>
                <div className="row-actions">
                  <Link to={`/admin/products/${product._id}/edit`}>Edit</Link>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(product._id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
