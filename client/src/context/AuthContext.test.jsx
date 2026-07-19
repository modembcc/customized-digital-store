import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as api from '../services/api';

function AuthHarness() {
  const { user, loading, isAuthenticated, isAdmin, login, signup, logout } = useAuth();

  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="authenticated">{String(isAuthenticated)}</p>
      <p data-testid="is-admin">{String(isAdmin)}</p>
      <p data-testid="email">{user?.email ?? ''}</p>
      <button onClick={() => login({ email: 'user@example.com', password: 'password123' }).catch(() => {})}>
        Login
      </button>
      <button onClick={() => signup({ email: 'new@example.com', password: 'password123' }).catch(() => {})}>
        Signup
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthHarness />
    </AuthProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthContext', () => {
  it('starts loading and settles to logged-out when there is no existing session', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));

    renderAuth();

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('hydrates the user from an existing session without an explicit login', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
      role: 'customer',
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent('existing@example.com');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('login success updates the user', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));
    vi.spyOn(api, 'login').mockResolvedValue({ id: '1', email: 'user@example.com', role: 'customer' });
    const user = userEvent.setup();

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent('user@example.com');
    });
  });

  it('login failure leaves the user logged out', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));
    vi.spyOn(api, 'login').mockRejectedValue(new Error('Invalid email or password'));
    const user = userEvent.setup();

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('signup success updates the user', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));
    vi.spyOn(api, 'signup').mockResolvedValue({ id: '2', email: 'new@example.com', role: 'customer' });
    const user = userEvent.setup();

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('Signup'));

    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent('new@example.com');
    });
  });

  it('logout clears the user', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
      role: 'customer',
    });
    vi.spyOn(api, 'logout').mockResolvedValue({ message: 'Logged out' });
    const user = userEvent.setup();

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('isAdmin is true only when the user has the admin role', async () => {
    vi.spyOn(api, 'fetchCurrentUser').mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    });
  });

  it('throws when useAuth is called outside an AuthProvider', () => {
    function Broken() {
      useAuth();
      return null;
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Broken />)).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
