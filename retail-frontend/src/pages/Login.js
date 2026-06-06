import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>RetailMS</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Retail Management System</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Sign In</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input className="form-input" placeholder="admin"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div style={{ marginTop: 20, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>Demo Credentials:</p>
            <p style={{ color: '#64748b' }}>admin / admin123 — Full access</p>
            <p style={{ color: '#64748b' }}>manager / manager123 — Manager</p>
            <p style={{ color: '#64748b' }}>cashier / cashier123 — Sales only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
