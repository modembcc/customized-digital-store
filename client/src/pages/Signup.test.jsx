import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Signup from './Signup';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

beforeEach(() => {
  vi.spyOn(api, 'fetchCurrentUser').mockRejectedValue(new Error('Not authenticated'));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<p>Home page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Signup', () => {
  it('submits the entered credentials', async () => {
    vi.spyOn(api, 'signup').mockResolvedValue({ id: '1', email: 'new@example.com', role: 'customer' });
    const user = userEvent.setup();

    renderSignup();
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(api.signup).toHaveBeenCalledWith({ email: 'new@example.com', password: 'password123' });
    });
  });

  it('shows the server error message on a rejected signup', async () => {
    vi.spyOn(api, 'signup').mockRejectedValue(new Error('This email is already registered'));
    const user = userEvent.setup();

    renderSignup();
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('This email is already registered');
    });
  });

  it('navigates home on success', async () => {
    vi.spyOn(api, 'signup').mockResolvedValue({ id: '1', email: 'new@example.com', role: 'customer' });
    const user = userEvent.setup();

    renderSignup();
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Home page')).toBeInTheDocument();
    });
  });
});
