import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const emptyForm = { email: '', password: '' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    try {
      await login(form);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h1>Log In</h1>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Log In</button>
      </form>
      <p>
        Don&apos;t have an account? <Link to="/signup">Sign up</Link>
      </p>
    </section>
  );
}
