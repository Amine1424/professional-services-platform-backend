import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRouteByRole, getStoredUser } from '../lib/role-routing';
import '../styles/auth.css';

type LoginLocationState = {
  from?: string;
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget = useMemo(() => {
    const redirectParam = new URLSearchParams(location.search).get('redirect');
    const state = location.state as LoginLocationState | null;
    const candidate = redirectParam || state?.from || '';

    if (!candidate.startsWith('/') || candidate.startsWith('/login')) {
      return null;
    }

    return candidate;
  }, [location.search, location.state]);

  useEffect(() => {
    const user = getStoredUser();
    const token = localStorage.getItem('accessToken');

    if (token && user) {
      navigate(redirectTarget || getDefaultRouteByRole(user.role), { replace: true });
    }
  }, [navigate, redirectTarget]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password.');
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      toast.success('Logged in successfully.');
      navigate(redirectTarget || getDefaultRouteByRole(result.data?.user.role), {
        replace: true,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: 520 }}>
        <div className="auth-header">
          <h1>Sign In</h1>
          <p>Access your account to message providers, manage requests, and track activity.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="StrongPass1!"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Need an account?</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Link to="/join/customer" className="link">
              Create customer account
            </Link>
            <Link to="/join/provider" className="link">
              Join as provider
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
