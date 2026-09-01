import { useEffect, useState } from 'react';
import { getLedgerList } from '../api/ledger';

const STATUS_COLOR = {
  converged: 'var(--moss)',
  failed: 'var(--rust)',
  active: 'var(--ink-soft)',
};

export default function LedgerList({ onSelect, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLedgerList().then(setSessions).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>
          Deal ledger
        </h2>
        <button onClick={onBack} className="text-sm" style={{ color: 'var(--accent)' }}>
          ← Back
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Loading…</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          No negotiations yet. Start one to see it here.
        </p>
      )}

      <div>
        {sessions.map((s, i) => (
          <button
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            className="w-full text-left py-4 flex items-center justify-between"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}
          >
            <div>
              <div className="text-sm" style={{ color: 'var(--ink)' }}>
                {s.item_name || 'Unknown item'} · {s.buyer_name || 'Unknown buyer'}
              </div>
              <div className="text-xs font-mono-data mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                {s.turn_count} turns · {new Date(s.created_at).toLocaleDateString()}
                {s.razorpay_order_id && <> · {s.razorpay_order_id}</>}
              </div>
            </div>
            <span
              className="text-xs inline-flex items-center gap-1.5"
              style={{ color: STATUS_COLOR[s.status] || 'var(--ink-soft)' }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
              {s.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}