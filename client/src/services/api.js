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
  const res = await fetch(`${BASE_URL}/products`, { credentials: 'include' });
  return handleResponse(res);
}

export async function fetchProductById(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`, { credentials: 'include' });
  return handleResponse(res);
}

export async function fetchAdminProducts() {
  const res = await fetch(`${BASE_URL}/admin/products`, { credentials: 'include' });
  return handleResponse(res);
}

export async function createProduct(product) {
  const res = await fetch(`${BASE_URL}/admin/products`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  return handleResponse(res);
}

export async function updateProduct(id, product) {
  const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  return handleResponse(res);
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function signup({ email, password }) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function login({ email, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function logout() {
  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function fetchCurrentUser() {
  const res = await fetch(`${BASE_URL}/auth/me`, { credentials: 'include' });
  return handleResponse(res);
}
