import { useEffect, useState } from 'react';
import { getMerchantDashboard } from '../api/merchants';

const STATUS_COLOR = {
  converged: 'var(--moss)',
  failed: 'var(--rust)',
  active: 'var(--ochre)',
};

function StatusDot({ status }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs"
      style={{ color: STATUS_COLOR[status] || 'var(--ink-soft)' }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {status}
    </span>
  );
}

export default function MerchantDashboard({ onListNew }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    getMerchantDashboard()
      .then(setData)
      .catch(() => setError('Could not load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-16 rounded" style={{ background: 'var(--paper-raised)', opacity: 0.5 + n * 0.1 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-sm px-3 py-2 rounded" style={{ background: 'var(--rust-soft)', color: 'var(--rust)' }}>{error}</p>
      </div>
    );
  }

  const { items = [], sessions = [] } = data || {};

  // Group sessions by catalog_item_id
  const sessionsByItem = sessions.reduce((acc, s) => {
    if (!acc[s.catalog_item_id]) acc[s.catalog_item_id] = [];
    acc[s.catalog_item_id].push(s);
    return acc;
  }, {});

  // Summary stats
  const totalSessions = sessions.length;
  const totalDeals = sessions.filter((s) => s.status === 'converged').length;
  const totalRevenue = sessions
    .filter((s) => s.status === 'converged' && s.final_terms?.total)
    .reduce((sum, s) => sum + Number(s.final_terms.total), 0);

  return (
    <div className="max-w-2xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Your inventory</h2>
        <button
          onClick={onListNew}
          className="text-sm px-4 py-2 rounded"
          style={{ background: 'var(--ochre)', color: 'var(--paper-raised)' }}
        >
          List new item
        </button>
      </div>

      {/* Summary stats — only show if there's activity */}
      {totalSessions > 0 && (
        <div
          className="mb-6 px-4 py-3 rounded grid grid-cols-3 gap-4 text-center"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--rule)' }}
        >
          <div>
            <div className="text-lg font-mono-data font-medium" style={{ color: 'var(--ink)' }}>{totalSessions}</div>
            <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>negotiations</div>
          </div>
          <div>
            <div className="text-lg font-mono-data font-medium" style={{ color: 'var(--moss)' }}>{totalDeals}</div>
            <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>deals closed</div>
          </div>
          <div>
            <div className="text-lg font-mono-data font-medium" style={{ color: 'var(--ink)' }}>
              {totalRevenue > 0 ? `₹${totalRevenue.toLocaleString('en-IN')}` : '—'}
            </div>
            <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>revenue</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div
          className="py-12 text-center rounded"
          style={{ border: '1px dashed var(--rule)' }}
        >
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>No items listed yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)', opacity: 0.7 }}>
            List an item so buyer agents can negotiate against it.
          </p>
        </div>
      )}

      {/* Catalog items */}
      <div>
        {items.map((item, i) => {
          const itemSessions = sessionsByItem[item.id] || [];
          const dealCount = itemSessions.filter((s) => s.status === 'converged').length;
          const isExpanded = expandedItem === item.id;

          return (
            <div
              key={item.id}
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}
            >
              {/* Item row */}
              <button
                className="w-full text-left py-4 flex items-center justify-between"
                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.name}</div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs font-mono-data" style={{ color: 'var(--ink-soft)' }}>
                    <span>list ₹{item.base_price}</span>
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
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--ink-soft)' }}>
                  {itemSessions.length > 0 && (
                    <span>
                      {dealCount}/{itemSessions.length} deals
                    </span>
                  )}
                  <span>{isExpanded ? '▾' : '▸'}</span>
                </div>
              </button>

              {/* Sessions for this item */}
              {isExpanded && (
                <div className="mb-4 rounded" style={{ background: 'var(--paper-raised)', border: '1px solid var(--rule)' }}>
                  {itemSessions.length === 0 ? (
                    <p className="text-xs px-4 py-3" style={{ color: 'var(--ink-soft)' }}>
                      No negotiations yet for this item.
                    </p>
                  ) : (
                    itemSessions.map((s, j) => (
                      <div
                        key={s.session_id}
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ borderTop: j === 0 ? 'none' : '1px solid var(--rule)' }}
                      >
                        <div>
                          <div className="text-xs font-medium" style={{ color: 'var(--ink)' }}>
                            {s.buyer_name || 'Unknown buyer'}
                          </div>
                          <div className="text-xs font-mono-data mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                            {s.turn_count} turns · {new Date(s.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            {s.final_terms?.total && (
                              <span style={{ color: 'var(--moss)' }}> · ₹{s.final_terms.total}</span>
                            )}
                          </div>
                          {s.razorpay_order_id && (
                            <div className="text-xs font-mono-data mt-0.5" style={{ color: 'var(--ink-soft)', opacity: 0.7 }}>
                              {s.razorpay_order_id}
                            </div>
                          )}
                        </div>
                        <StatusDot status={s.status} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
