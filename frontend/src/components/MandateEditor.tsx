import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function MandateEditor({ onCreated }: { onCreated: (id: string, mandate: object) => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ max_total_spend: '', max_unit_price: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const maxTotal = Number(form.max_total_spend);
    const maxUnit = Number(form.max_unit_price);

    if (maxUnit > maxTotal) {
      setError('Max unit price cannot exceed max total spend.');
      return;
    }

    setCreating(true);
    try {
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await api.post('/mandates', {
        principal_name: user.display_name,
        max_total_spend: maxTotal,
        max_unit_price: maxUnit,
        expires_at,
      });
      onCreated(res.data.id, {
        id: res.data.id,
        max_total_spend: maxTotal,
        max_unit_price: maxUnit,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not create mandate. Try again.');
    } finally {
      setCreating(false);
    }
  }

  const inputStyle = { border: '1px solid var(--rule)', background: 'var(--paper-raised)', color: 'var(--ink)' };

  return (
    <div className="max-w-lg mx-auto px-6">
      <div style={{ borderLeft: '3px solid var(--accent)' }} className="pl-5">
        <h2 className="font-display text-xl mb-1" style={{ color: 'var(--ink)' }}>
          Set your mandate
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
          This defines what your Buyer Vakil is authorised to spend on its own - without asking again.
          Not sure what to set? Check the{' '}
          <a
            href="#catalog"
            onClick={(e) => {
              // Handled at App level via the Catalog nav tab - just a visual hint here
              e.preventDefault();
              const btn = document.querySelector<HTMLButtonElement>('[data-nav="catalog-browse"]');
              btn?.click();
            }}
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          >
            catalog
          </a>{' '}
          first.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="max_total_spend" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
                Max total spend (₹)
              </label>
              <input
                id="max_total_spend"
                type="number"
                min="1"
                value={form.max_total_spend}
                onChange={(e) => setForm({ ...form, max_total_spend: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm font-mono-data"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="max_unit_price" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
                Max unit price (₹)
              </label>
              <input
                id="max_unit_price"
                type="number"
                min="1"
                value={form.max_unit_price}
                onChange={(e) => setForm({ ...form, max_unit_price: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm font-mono-data"
                style={inputStyle}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded" style={{ background: 'var(--rust-soft)', color: 'var(--rust)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="text-sm px-4 py-2 rounded disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--paper-raised)' }}
          >
            {creating ? 'Creating mandate…' : 'Create mandate'}
          </button>
        </form>
      </div>
    </div>
  );
}
