import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RequireAdmin from './RequireAdmin';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

afterEach(() => {
  vi.restoreAllMocks();
});

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/" element={<p>Home page</p>} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<p>Admin page</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('RequireAdmin', () => {
  it('shows a loading state while auth is still hydrating', () => {
    vi.spyOn(api, 'fetchCurrentUser').mockReturnValue(new Promise(() => {}));

    renderGuarded();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin page')).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));

    renderGuarded();

    await waitFor(() => {
      expect(screen.getByText('Login page')).toBeInTheDocument();
    });
  });

  it('redirects away when authenticated as a customer', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'customer@example.com',
      role: 'customer',
    });

    renderGuarded();

    await waitFor(() => {
      expect(screen.getByText('Home page')).toBeInTheDocument();
    });
  });

  it('renders the protected content when authenticated as an admin', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
    });

    renderGuarded();

    await waitFor(() => {
      expect(screen.getByText('Admin page')).toBeInTheDocument();
    });
  });
});
