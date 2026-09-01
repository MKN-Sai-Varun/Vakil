import { useState, useRef, useEffect } from 'react';
import { createSession, runNegotiation, getSession } from '../api/sessions';

const ACTOR_LABEL = { buyer: 'Buyer Vakil', merchant: 'Merchant Vakil' };
const ACTOR_COLOR = { buyer: 'var(--accent)', merchant: 'var(--ochre)' };

const RESULT_STYLE = {
  pass: { color: 'var(--moss)', label: 'passed' },
  adjusted: { color: 'var(--ochre)', label: 'adjusted' },
  blocked: { color: 'var(--rust)', label: 'blocked' },
};

const MAX_TURNS = 10;
const POLL_INTERVAL_MS = 1200;

// Strip em-dashes from gate reason strings
function cleanReason(str) {
  if (!str) return '';
  return str.replace(/\s*—\s*/g, ': ').replace(/\s*–\s*/g, ': ');
}

export default function NegotiationTheater({ mandateId, catalogItemId, mandate, onChangeItem, onNewNegotiation }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thinkingActor, setThinkingActor] = useState(null);
  const [dealInfo, setDealInfo] = useState(null); // { razorpay_order_id, final_terms }
  const pollRef = useRef(null);

  const isFinished = session && (session.status === 'converged' || session.status === 'failed');
  const isActive = session && !isFinished;
  const turnCount = session?.turns?.length ?? 0;
  const roundCount = Math.ceil(turnCount / 2);

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  async function handleStart() {
    if (loading) return;
    setError(null);
    setLoading(true);
    setDealInfo(null);
    setThinkingActor('buyer');

    try {
      const newSession = await createSession(mandateId, catalogItemId);
      setSession(newSession);
      await runNegotiation(newSession.id);

      pollRef.current = setInterval(async () => {
        try {
          const updated = await getSession(newSession.id);
          const isDone = updated.status === 'converged' || updated.status === 'failed';

          setSession((prev) => {
            const prevTurnCount = prev?.turns?.length ?? 0;
            const newTurnCount = updated.turns?.length ?? 0;
            if (!isDone && newTurnCount > prevTurnCount) {
              const lastActor = updated.turns[newTurnCount - 1].actor;
              setThinkingActor(lastActor === 'buyer' ? 'merchant' : 'buyer');
            }
            return updated;
          });

          if (isDone) {
            clearInterval(pollRef.current);
            setThinkingActor(null);
            setLoading(false);
            // Surface deal info immediately after convergence
            if (updated.status === 'converged' && updated.deal) {
              setDealInfo(updated.deal);
            }
          }
        } catch {
          clearInterval(pollRef.current);
          setLoading(false);
          setThinkingActor(null);
          setError('Lost connection while checking for updates.');
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  }

  function handleReset() {
    clearInterval(pollRef.current);
    setSession(null);
    setError(null);
    setThinkingActor(null);
    setDealInfo(null);
    if (onNewNegotiation) onNewNegotiation();
  }

  return (
    <div className="max-w-2xl mx-auto px-6">

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

      {/* Header row */}
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>
            Negotiation
          </h2>
          {/* Turn counter — shown once negotiation is running */}
          {session && (
            <span className="text-xs font-mono-data" style={{ color: 'var(--ink-soft)' }}>
              Turn {turnCount} / {MAX_TURNS}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Change item — only when not actively negotiating */}
          {!isActive && !loading && onChangeItem && (
            <button
              onClick={onChangeItem}
              className="text-sm"
              style={{ color: 'var(--ink-soft)' }}
            >
              ← Change item
            </button>
          )}

          {!session && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="text-sm px-4 py-2 rounded disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--paper-raised)' }}
            >
              {loading ? 'Negotiating…' : 'Start negotiation'}
            </button>
          )}

          {isFinished && (
            <button
              onClick={handleReset}
              className="text-sm px-4 py-2 rounded"
              style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
            >
              New negotiation
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded text-sm"
          style={{ background: 'var(--rust-soft)', color: 'var(--rust)' }}
        >
          {error}
        </div>
      )}

      {/* Session status pill */}
      {session && (
        <div className="mb-5 flex items-center gap-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
          <span className="font-mono-data">{session.id.slice(0, 8)}</span>
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              color: session.status === 'converged'
                ? 'var(--moss)'
                : session.status === 'failed'
                ? 'var(--rust)'
                : 'var(--ink-soft)',
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
            {session.status}
          </span>
        </div>
      )}

      {/* Turn transcript */}
      <div>
        {session?.turns?.map((turn, i) => {
          const move = typeof turn.proposed_move === 'string'
            ? JSON.parse(turn.proposed_move)
            : turn.proposed_move;
          const result = RESULT_STYLE[turn.policy_result] || RESULT_STYLE.pass;
          return (
            <div
              key={turn.id}
              className="py-4"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--rule)' }}
            >
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: ACTOR_COLOR[turn.actor] }}>
                  {ACTOR_LABEL[turn.actor]}
                </span>
                <span className="text-xs" style={{ color: result.color }}>
                  {result.label}
                </span>
              </div>

              <div className="text-sm mb-1" style={{ color: 'var(--ink)' }}>
                <span className="font-mono-data">{move.type}</span>
                {move.unit_price != null && (
                  <span className="font-mono-data" style={{ color: 'var(--ink-soft)' }}>
                    {' '}· ₹{move.unit_price} × {move.quantity}
                  </span>
                )}
                {move.bundle_items?.length > 0 && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--ochre-soft)', color: 'var(--ochre)' }}
                  >
                    volume bundle
                  </span>
                )}
              </div>

              {move.rationale && (
                <p className="text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>
                  {move.rationale}
                </p>
              )}

              {turn.reason && (
                <p className="text-xs" style={{ color: 'var(--ink-soft)', opacity: 0.75 }}>
                  {cleanReason(turn.reason)}
                </p>
              )}
            </div>
          );
        })}

        {/* Thinking indicator */}
        {thinkingActor && (
          <div
            className="py-4"
            style={{ borderTop: session?.turns?.length ? '1px solid var(--rule)' : 'none' }}
          >
            <span className="text-sm" style={{ color: ACTOR_COLOR[thinkingActor] }}>
              {ACTOR_LABEL[thinkingActor]} is considering its move…
            </span>
          </div>
        )}

        {/* Outcome card */}
        {isFinished && (
          <div
            className="mt-2 p-4 rounded"
            style={{
              borderTop: '1px solid var(--rule)',
              background: session.status === 'converged' ? 'var(--moss-soft)' : 'var(--paper-raised)',
            }}
          >
            {session.status === 'converged' ? (
              <>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--moss)' }}>
                  Deal reached.
                </p>
                {dealInfo && (
                  <div className="space-y-1">
                    <p className="text-sm font-mono-data" style={{ color: 'var(--ink)' }}>
                      ₹{dealInfo.final_terms?.unit_price} × {dealInfo.final_terms?.quantity} = ₹{dealInfo.final_terms?.total}
                    </p>
                    <p className="text-xs font-mono-data" style={{ color: 'var(--ink-soft)' }}>
                      Razorpay order: {dealInfo.razorpay_order_id}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                {session.turns?.[session.turns.length - 1]?.policy_result === 'blocked'
                  ? cleanReason(session.turns[session.turns.length - 1].reason)
                  : 'Both sides negotiated in good faith, but neither found terms they could agree to.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
