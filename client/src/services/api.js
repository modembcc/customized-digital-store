const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && data.message) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/products`);
  return handleResponse(res);
}

export async function fetchProductById(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  return handleResponse(res);
}

export async function fetchAdminProducts() {
  const res = await fetch(`${BASE_URL}/admin/products`);
  return handleResponse(res);
}

export async function createProduct(product) {
  const res = await fetch(`${BASE_URL}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  return handleResponse(res);
}

export async function updateProduct(id, product) {
  const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  return handleResponse(res);
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}
