import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

beforeEach(() => {
  vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<p>Home page</p>} />
          <Route path="/admin" element={<p>Admin page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login', () => {
  it('submits the entered credentials', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
    });
  });

  it('shows the server error message on a rejected login', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(new Error('Invalid email or password'));
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
    });
  });

  it('navigates to the redirect target on success', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'admin' });
    const user = userEvent.setup();

    renderLogin([{ pathname: '/login', state: { from: '/admin' } }]);
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Admin page')).toBeInTheDocument();
    });
  });
});
