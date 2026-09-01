import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function BuyerCatalogPicker({ mandate, onSelect, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/catalog-items').then((res) => setItems(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto px-6">
      {/* Mandate summary banner */}
      {mandate && (
        <div
          className="mb-6 px-4 py-3 rounded flex items-center justify-between text-sm"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--rule)' }}
        >
          <span style={{ color: 'var(--ink-soft)' }}>Your mandate</span>
          <span className="font-mono-data" style={{ color: 'var(--ink)' }}>
            ₹{mandate.max_unit_price}/unit · ₹{mandate.max_total_spend} total
          </span>
        </div>
      )}

      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="font-display text-xl mb-1" style={{ color: 'var(--ink)' }}>Choose an item</h2>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Pick something for your Buyer Vakil to negotiate for.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm"
          style={{ color: 'var(--accent)' }}
        >
          ← Edit mandate
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-12 rounded"
              style={{ background: 'var(--paper-raised)', opacity: 0.6 }}
            />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div
          className="py-10 text-center rounded"
          style={{ border: '1px dashed var(--rule)' }}
        >
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            No catalog items yet.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)', opacity: 0.7 }}>
            A merchant needs to list an item before you can negotiate.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div>
          {items.map((item, i) => {
            const withinBudget = !mandate || item.base_price <= mandate.max_unit_price;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="w-full text-left py-4 flex items-center justify-between"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}
              >
                <div>
                  <span className="text-sm" style={{ color: 'var(--ink)' }}>{item.name}</span>
                  {!withinBudget && (
                    <span
                      className="ml-2 text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--rust-soft)', color: 'var(--rust)' }}
                    >
                      above mandate
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono-data" style={{ color: 'var(--ink-soft)' }}>
                  list ₹{item.base_price}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
