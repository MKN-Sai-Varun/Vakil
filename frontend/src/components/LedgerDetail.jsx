import { useEffect, useState } from 'react';
import { getLedgerDetail } from '../api/ledger';

const ACTOR_STYLES = {
  buyer: 'bg-blue-50 border-blue-300 text-blue-900',
  merchant: 'bg-amber-50 border-amber-300 text-amber-900',
};

const RESULT_BADGE = {
  pass: 'bg-green-100 text-green-800',
  adjusted: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-800',
};

export default function LedgerDetail({ sessionId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLedgerDetail(sessionId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p className="text-center text-gray-500 mt-8">Loading...</p>;
  if (!detail) return <p className="text-center text-gray-500 mt-8">Not found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={onBack} className="text-sm text-indigo-600 hover:underline mb-4">
        ← Back to Ledger
      </button>

      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {detail.item_name} — {detail.buyer_name}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Session {detail.id} · {detail.status} · {detail.turn_count} turns
      </p>

      {detail.deal && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h3 className="font-medium text-indigo-900 mb-1">Settlement</h3>
          <p className="text-sm text-indigo-800">
            Order: {detail.deal.razorpay_order_id} · Status: {detail.deal.status}
          </p>
          <p className="text-sm text-indigo-800">
            Final terms: ₹{detail.deal.final_terms.unit_price}/unit × {detail.deal.final_terms.quantity} = ₹{detail.deal.final_terms.total}
          </p>
        </div>
      )}

      <h3 className="font-medium text-gray-700 mb-2">Negotiation Transcript</h3>
      <div className="space-y-3 mb-6">
        {detail.turns.map((turn) => (
          <div key={turn.id} className={`p-4 rounded-lg border ${ACTOR_STYLES[turn.actor]}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold capitalize">{turn.actor} Vakil</span>
              <span className={`text-xs px-2 py-0.5 rounded ${RESULT_BADGE[turn.policy_result]}`}>
                {turn.policy_result}
              </span>
            </div>
            <div className="text-sm">
              <strong>{turn.proposed_move.type}</strong>
              {turn.proposed_move.unit_price != null && (
                <> — ₹{turn.proposed_move.unit_price}/unit × {turn.proposed_move.quantity}</>
              )}
            </div>
            {turn.proposed_move.rationale && (
              <p className="text-sm mt-1 italic opacity-80">"{turn.proposed_move.rationale}"</p>
            )}
            <p className="text-xs mt-1 opacity-60">{turn.reason}</p>
          </div>
        ))}
      </div>

      {detail.auditEvents?.length > 0 && (
        <>
          <h3 className="font-medium text-gray-700 mb-2">Audit Events</h3>
          <div className="space-y-2">
            {detail.auditEvents.map((ev) => (
              <div key={ev.id} className="p-3 bg-gray-50 border rounded text-sm">
                <span className="font-medium">{ev.event_type}</span>
                <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                  {JSON.stringify(ev.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}