import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, fetchProductById, updateProduct, uploadProductImage } from '../../services/api';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  sku: '',
  stock: '',
  imageUrl: '',
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    fetchProductById(id)
      .then((product) =>
        setForm({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          sku: product.sku,
          stock: product.stock,
          imageUrl: product.imageUrl,
        })
      )
      .catch((err) => setError(err.message));
  }, [id, isEditing]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleImageChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const { imageUrl } = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, imageUrl }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };
    if (!payload.imageUrl) delete payload.imageUrl;

    try {
      if (isEditing) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1>{isEditing ? 'Edit Product' : 'Add Product'}</h1>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} required />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          required
        />

        <label htmlFor="price">Price</label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={handleChange}
          required
        />

        <label htmlFor="category">Category</label>
        <input id="category" name="category" value={form.category} onChange={handleChange} required />

        <label htmlFor="sku">SKU</label>
        <input id="sku" name="sku" value={form.sku} onChange={handleChange} required />

        <label htmlFor="stock">Stock</label>
        <input
          id="stock"
          name="stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={handleChange}
          required
        />

        <label htmlFor="image">Product Image</label>
        <input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
        {uploading && <p>Uploading...</p>}
        {form.imageUrl && (
          <img src={form.imageUrl} alt="Product preview" className="image-preview" />
        )}

        <button type="submit" disabled={uploading}>
          {isEditing ? 'Save Changes' : 'Create Product'}
        </button>
      </form>
    </section>
  );
}
