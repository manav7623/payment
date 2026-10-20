import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Lock, Mail, ArrowRight, User } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('manav@paytrack.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('manav@paytrack.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'var(--bg-page)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 1.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <CreditCard size={28} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            PayTrack
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>
            Simple Personal Expense Tracking
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="name@paytrack.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ height: '44px', fontSize: '0.95rem' }}
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast Login Button */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={handleFillDemo}
            className="btn btn-secondary btn-full btn-sm"
            style={{ fontSize: '0.85rem', gap: '6px' }}
          >
            <User size={14} style={{ color: 'var(--primary)' }} />
            <span>Fill Demo Account (manav@paytrack.com)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
