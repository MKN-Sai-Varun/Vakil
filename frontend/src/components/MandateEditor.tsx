import { useState } from 'react';
import { api } from '../api/client';

export default function MandateEditor({ onCreated }) {
  const [form, setForm] = useState({
    principal_name: '',
    max_total_spend: '',
    max_unit_price: '',
  });
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/mandates', {
        ...form,
        max_total_spend: Number(form.max_total_spend),
        max_unit_price: Number(form.max_unit_price),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      onCreated(res.data.id);
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-3">
      <h2 className="text-lg font-semibold">Create Buyer Mandate</h2>
      <input
        placeholder="Principal name"
        value={form.principal_name}
        onChange={(e) => setForm({ ...form, principal_name: e.target.value })}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="number"
        placeholder="Max total spend"
        value={form.max_total_spend}
        onChange={(e) => setForm({ ...form, max_total_spend: e.target.value })}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="number"
        placeholder="Max unit price"
        value={form.max_unit_price}
        onChange={(e) => setForm({ ...form, max_unit_price: e.target.value })}
        className="w-full border rounded px-3 py-2"
        required
      />
      <button
        type="submit"
        disabled={creating}
        className="w-full bg-indigo-600 text-white rounded py-2 disabled:opacity-50"
      >
        {creating ? 'Creating...' : 'Create Mandate'}
      </button>
    </form>
  );
}