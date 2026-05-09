import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiActivity, FiMail, FiLock, FiUser } from 'react-icons/fi';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(identifier, password);
    if (err) {
      setError(err.message || 'Invalid credentials');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-section">
          <div className="hospital-icon">
            <FiActivity />
          </div>
          <h1>RNS Hospitals</h1>
          <p>Staff Management Portal</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Email or Username
            </label>
            <div className="input-group">
              <span className="input-group-text" style={{ background: '#f8f9fa' }}>
                <FiUser size={16} color="#7f8c8d" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text" style={{ background: '#f8f9fa' }}>
                <FiLock size={16} color="#7f8c8d" />
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-rns-primary w-100"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-3">
          <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
            New staff member?{' '}
            <Link to="/register" style={{ color: 'var(--rns-primary)', fontWeight: 600 }}>
              Register here
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
