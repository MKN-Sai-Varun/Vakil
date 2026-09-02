import { useState } from 'react';
import { api } from '../api/client';

export default function CatalogEditor({ merchantId, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    base_price: '',
    floor_price: '',
    inventory_qty: '',
    daily_discount_budget: '',
    allow_bundles: false,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const base = Number(form.base_price);
    const floor = Number(form.floor_price);
    if (floor > base) {
      setError('Floor price cannot exceed list price. The Merchant Vakil can never sell below floor.');
      return;
    }
    if (floor <= 0 || base <= 0) {
      setError('List price and floor price must both be greater than zero.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/catalog-items', {
        ...form,
        merchant_id: merchantId,
        base_price: Number(form.base_price),
        floor_price: Number(form.floor_price),
        inventory_qty: Number(form.inventory_qty),
        daily_discount_budget: Number(form.daily_discount_budget),
        bundle_rules: form.allow_bundles ? [{ min_quantity: 10, discount_pct: 5 }] : [],
      });
      onCreated(res.data.id);
    } finally {
      setCreating(false);
    }
  }

  const inputStyle = {
    border: '1px solid var(--rule)',
    background: 'var(--paper-raised)',
    color: 'var(--ink)',
  };

  return (
    <div className="max-w-lg mx-auto px-6">
      <div style={{ borderLeft: '3px solid var(--ochre)' }} className="pl-5">
        <h2 className="font-display text-xl mb-1" style={{ color: 'var(--ink)' }}>
          Set the merchant's corridor
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
          The Merchant Vakil can negotiate freely within these bounds — it can never sell below floor.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
              Item name
            </label>
            <input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="base_price" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
                List price (₹)
              </label>
              <input
                id="base_price"
                type="number"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm font-mono-data"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="floor_price" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
                Floor price (₹)
              </label>
              <input
                id="floor_price"
                type="number"
                value={form.floor_price}
                onChange={(e) => setForm({ ...form, floor_price: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm font-mono-data"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="inventory_qty" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
                Inventory
              </label>
              <input
                id="inventory_qty"
                type="number"
                value={form.inventory_qty}
                onChange={(e) => setForm({ ...form, inventory_qty: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm font-mono-data"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="daily_discount_budget" className="block text-sm mb-1" style={{ color: 'var(--ink)' }}>
                Daily discount budget (₹)
              </label>
              <input
                id="daily_discount_budget"
                type="number"
                value={form.daily_discount_budget}
                onChange={(e) => setForm({ ...form, daily_discount_budget: e.target.value })}
                className="w-full rounded px-3 py-2 text-sm font-mono-data"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
            <input
              type="checkbox"
              checked={form.allow_bundles}
              onChange={(e) => setForm({ ...form, allow_bundles: e.target.checked })}
            />
            Allow volume-discount bundles for orders of 10 or more
          </label>

          {error && (
            <p className="text-sm px-3 py-2 rounded" style={{ background: 'var(--rust-soft)', color: 'var(--rust)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="text-sm px-4 py-2 rounded disabled:opacity-50"
            style={{ background: 'var(--ochre)', color: 'var(--paper-raised)' }}
          >
            {creating ? 'Creating item…' : 'Create catalog item'}
          </button>
        </form>
      </div>
    </div>
  );
}
