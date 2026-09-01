import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function CatalogBrowser() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/catalog-items')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load catalog. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-lg mx-auto px-6">
      <div className="mb-6">
        <h2 className="font-display text-xl mb-1" style={{ color: 'var(--ink)' }}>Catalog</h2>
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          All items currently listed by merchants.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-16 rounded"
              style={{ background: 'var(--paper-raised)', opacity: 0.5 + n * 0.1 }}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm px-3 py-2 rounded" style={{ background: 'var(--rust-soft)', color: 'var(--rust)' }}>
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div
          className="py-12 text-center rounded"
          style={{ border: '1px dashed var(--rule)' }}
        >
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            No items listed yet.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)', opacity: 0.7 }}>
            Merchants can add items from their Negotiate tab.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div>
          {items.map((item, i) => (
            <div
              key={item.id}
              className="py-4"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.name}</span>
                <span className="text-sm font-mono-data" style={{ color: 'var(--ink)' }}>
                  ₹{item.base_price}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono-data" style={{ color: 'var(--ink-soft)' }}>
                <span>floor ₹{item.floor_price}</span>
                <span>stock {item.inventory_qty}</span>
                {item.bundle_rules?.length > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--ochre-soft)', color: 'var(--ochre)' }}
                  >
                    bundles
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
