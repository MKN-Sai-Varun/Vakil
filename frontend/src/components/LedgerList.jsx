import { useEffect, useState } from 'react';
import { getLedgerList } from '../api/ledger';

const STATUS_STYLES = {
  converged: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  active: 'bg-gray-100 text-gray-700',
  expired: 'bg-gray-100 text-gray-700',
};

export default function LedgerList({ onSelect, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLedgerList()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Deal Ledger</h2>
        <button onClick={onBack} className="text-sm text-indigo-600 hover:underline">
          ← Back to Negotiation
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-gray-500">No sessions yet.</p>
      )}

      <div className="space-y-2">
        {sessions.map((s) => (
          <button
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            className="w-full text-left p-4 bg-white border rounded-lg hover:border-indigo-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">
                {s.item_name || 'Unknown item'} — {s.buyer_name || 'Unknown buyer'}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-700'}`}>
                {s.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {s.turn_count} turns · {new Date(s.created_at).toLocaleString()}
              {s.razorpay_order_id && <> · Order: {s.razorpay_order_id}</>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}