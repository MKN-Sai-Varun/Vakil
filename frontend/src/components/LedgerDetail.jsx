import { useEffect, useState } from 'react';
import { getLedgerDetail } from '../api/ledger';

const ACTOR_LABEL = { buyer: 'Buyer Vakil', merchant: 'Merchant Vakil' };
const ACTOR_COLOR = { buyer: 'var(--accent)', merchant: 'var(--ochre)' };
const RESULT_STYLE = {
  pass: { color: 'var(--moss)', label: 'passed' },
  adjusted: { color: 'var(--ochre)', label: 'adjusted' },
  blocked: { color: 'var(--rust)', label: 'blocked' },
};

// Build the Proof of Fair Deal narrative from turn data
function buildVerdict(turns, deal, status) {
  if (!turns || turns.length === 0) return null;

  const adjustedTurns = turns.filter((t) => t.policy_result === 'adjusted');
  const blockedTurns = turns.filter((t) => t.policy_result === 'blocked');
  const totalRounds = Math.ceil(turns.length / 2);

  const lines = [];

  if (status === 'converged' && deal) {
    const ft = deal.final_terms;
    lines.push(`Deal closed in ${totalRounds} round${totalRounds !== 1 ? 's' : ''} at ₹${ft.unit_price}/unit × ${ft.quantity} = ₹${ft.total}.`);
  } else {
    lines.push(`No deal reached after ${totalRounds} round${totalRounds !== 1 ? 's' : ''}.`);
  }

  if (adjustedTurns.length > 0) {
    const buyerAdjusted = adjustedTurns.filter((t) => t.actor === 'buyer');
    const merchantAdjusted = adjustedTurns.filter((t) => t.actor === 'merchant');
    if (buyerAdjusted.length > 0)
      lines.push(`Buyer: ${buyerAdjusted.length} move${buyerAdjusted.length !== 1 ? 's' : ''} adjusted by mandate gate (quantity reduced to fit spend cap).`);
    if (merchantAdjusted.length > 0)
      lines.push(`Merchant: ${merchantAdjusted.length} move${merchantAdjusted.length !== 1 ? 's' : ''} adjusted by policy gate (price clamped to floor or discount limit).`);
  }

  if (blockedTurns.length > 0) {
    const lastBlocked = blockedTurns[blockedTurns.length - 1];
    lines.push(`Blocked: ${cleanReason(lastBlocked.reason)}`);
  }

  if (status === 'converged' && deal) {
    lines.push(`Razorpay order ${deal.razorpay_order_id} created. Status: ${deal.status}.`);
  }

  return lines;
}

// Strip em-dashes from gate reason strings for display
function cleanReason(str) {
  if (!str) return '';
  return str.replace(/\s*—\s*/g, ': ').replace(/\s*–\s*/g, ': ');
}

export default function LedgerDetail({ sessionId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    getLedgerDetail(sessionId).then(setDetail).finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p className="text-center text-sm mt-8" style={{ color: 'var(--ink-soft)' }}>Loading…</p>;
  if (!detail) return <p className="text-center text-sm mt-8" style={{ color: 'var(--ink-soft)' }}>Not found.</p>;

  const verdict = buildVerdict(detail.turns, detail.deal, detail.status);

  return (
    <div className="max-w-2xl mx-auto px-6">
      <button onClick={onBack} className="text-sm mb-6" style={{ color: 'var(--accent)' }}>
        ← Back to ledger
      </button>

      <h2 className="font-display text-xl mb-1" style={{ color: 'var(--ink)' }}>
        {detail.item_name} · {detail.buyer_name}
      </h2>
      <p className="text-xs font-mono-data mb-6" style={{ color: 'var(--ink-soft)' }}>
        {detail.id} · {detail.status} · {detail.turn_count} turns
      </p>

      {/* Proof of Fair Deal card */}
      {verdict && (
        <div
          className="mb-8 p-4 rounded"
          style={{
            background: detail.status === 'converged' ? 'var(--moss-soft)' : 'var(--paper-raised)',
            border: `1px solid ${detail.status === 'converged' ? 'var(--moss)' : 'var(--rule)'}`,
          }}
        >
          <h3
            className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: detail.status === 'converged' ? 'var(--moss)' : 'var(--ink-soft)', letterSpacing: '0.08em' }}
          >
            Proof of Fair Deal
          </h3>
          <ul className="space-y-1.5">
            {verdict.map((line, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--ink)' }}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Transcript</h3>
      <div className="mb-8">
        {detail.turns.map((turn, i) => {
          const move = typeof turn.proposed_move === 'string'
            ? JSON.parse(turn.proposed_move)
            : turn.proposed_move;
          const result = RESULT_STYLE[turn.policy_result] || RESULT_STYLE.pass;
          return (
            <div key={turn.id} className="py-4" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: ACTOR_COLOR[turn.actor] }}>
                  {ACTOR_LABEL[turn.actor]}
                </span>
                <span className="text-xs" style={{ color: result.color }}>{result.label}</span>
              </div>
              <div className="text-sm mb-1" style={{ color: 'var(--ink)' }}>
                <span className="font-mono-data">{move.type}</span>
                {move.unit_price != null && (
                  <span className="font-mono-data" style={{ color: 'var(--ink-soft)' }}>
                    {' '}· ₹{move.unit_price} × {move.quantity}
                  </span>
                )}
              </div>
              {move.rationale && (
                <p className="text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>{move.rationale}</p>
              )}
              {turn.reason && (
                <p className="text-xs" style={{ color: 'var(--ink-soft)', opacity: 0.75 }}>
                  {cleanReason(turn.reason)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {detail.auditEvents?.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setAuditOpen((v) => !v)}
            className="text-sm flex items-center gap-1.5 mb-3"
            style={{ color: 'var(--ink-soft)' }}
          >
            <span>{auditOpen ? '▾' : '▸'}</span>
            Audit trail ({detail.auditEvents.length} event{detail.auditEvents.length !== 1 ? 's' : ''})
          </button>
          {auditOpen && (
            <div>
              {detail.auditEvents.map((ev, i) => (
                <div key={ev.id} className="py-3 flex items-start justify-between gap-4" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}>
                  <span className="text-sm" style={{ color: 'var(--ink)' }}>{ev.event_type}</span>
                  <span className="text-xs font-mono-data text-right" style={{ color: 'var(--ink-soft)' }}>
                    {ev.payload?.razorpay_order_id
                      ? ev.payload.razorpay_order_id
                      : ev.payload?.reason
                      ? cleanReason(ev.payload.reason)
                      : new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}