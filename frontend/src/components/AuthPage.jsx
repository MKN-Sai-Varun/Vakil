import { useState } from 'react';
import { login, signup } from '../api/auth';
import { useAuth } from '../auth/AuthContext';

export default function AuthPage() {
  const { loginUser } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', role: 'buyer', display_name: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const inputStyle = { border: '1px solid var(--rule)', background: 'var(--paper-raised)', color: 'var(--ink)' };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = mode === 'login'
        ? await login(form.email, form.password)
        : await signup(form.email, form.password, form.role, form.display_name);
      console.log('[auth] submit succeeded, response data:', data);
      loginUser(data.token, data.user);
    } catch (err) {
      console.error('[auth] submit failed:', err.response?.status, err.response?.data);
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 pt-16">
      <h1 className="font-display text-2xl mb-1" style={{ color: 'var(--ink)' }}>Vakil</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--ink-soft)' }}>
        {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div>
              <label htmlFor="display_name" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
                Name
              </label>
              <input
                id="display_name"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <span className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>I am a</span>
              <div className="flex gap-4 text-sm" style={{ color: 'var(--ink)' }}>
                <label htmlFor="role_buyer" className="flex items-center gap-1.5">
                  <input
                    id="role_buyer"
                    type="radio"
                    name="role"
                    checked={form.role === 'buyer'}
                    onChange={() => setForm({ ...form, role: 'buyer' })}
                  />
                  Buyer
                </label>
                <label htmlFor="role_merchant" className="flex items-center gap-1.5">
                  <input
                    id="role_merchant"
                    type="radio"
                    name="role"
                    checked={form.role === 'merchant'}
                    onChange={() => setForm({ ...form, role: 'merchant' })}
                  />
                  Merchant
                </label>
              </div>
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded px-3 py-2 text-sm"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded px-3 py-2 text-sm"
            style={inputStyle}
            minLength={mode === 'signup' ? 8 : undefined}
            required
          />
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded" style={{ background: 'var(--rust-soft)', color: 'var(--rust)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full text-sm px-4 py-2 rounded disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--paper-raised)' }}
        >
          {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
        className="text-sm mt-4"
        style={{ color: 'var(--accent)' }}
      >
        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}