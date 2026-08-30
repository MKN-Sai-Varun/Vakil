import { useState } from 'react';
import { api } from '../api/client';

export default function CatalogEditor({ merchantId, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    base_price: '',
    floor_price: '',
    inventory_qty: '',
    daily_discount_budget: '',
  });
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/catalog-items', {
        ...form,
        merchant_id: merchantId,
        base_price: Number(form.base_price),
        floor_price: Number(form.floor_price),
        inventory_qty: Number(form.inventory_qty),
        daily_discount_budget: Number(form.daily_discount_budget),
      });
      onCreated(res.data.id);
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-3">
      <h2 className="text-lg font-semibold">Create Catalog Item</h2>
      <input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
      <input type="number" placeholder="Base price" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="w-full border rounded px-3 py-2" required />
      <input type="number" placeholder="Floor price" value={form.floor_price} onChange={(e) => setForm({ ...form, floor_price: e.target.value })} className="w-full border rounded px-3 py-2" required />
      <input type="number" placeholder="Inventory quantity" value={form.inventory_qty} onChange={(e) => setForm({ ...form, inventory_qty: e.target.value })} className="w-full border rounded px-3 py-2" required />
      <input type="number" placeholder="Daily discount budget" value={form.daily_discount_budget} onChange={(e) => setForm({ ...form, daily_discount_budget: e.target.value })} className="w-full border rounded px-3 py-2" required />
      <button type="submit" disabled={creating} className="w-full bg-amber-600 text-white rounded py-2 disabled:opacity-50">
        {creating ? 'Creating...' : 'Create Catalog Item'}
      </button>
    </form>
  );
}