import { useState, useRef, useEffect } from 'react';
import { createSession, runNegotiation, getSession } from '../api/sessions';

const ACTOR_STYLES = {
  buyer: 'bg-blue-50 border-blue-300 text-blue-900',
  merchant: 'bg-amber-50 border-amber-300 text-amber-900',
};

const RESULT_BADGE = {
  pass: 'bg-green-100 text-green-800',
  adjusted: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-800',
};

const POLL_INTERVAL_MS = 1200;

export default function NegotiationTheater({ mandateId, catalogItemId }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thinkingActor, setThinkingActor] = useState(null);
  const pollRef = useRef(null);

  const isFinished = session && (session.status === 'converged' || session.status === 'failed');

  useEffect(() => {
    return () => clearInterval(pollRef.current); // cleanup on unmount
  }, []);

  async function handleStart() {
    if(loading) return;
    setError(null);
    setLoading(true);
    setThinkingActor('buyer'); // buyer always moves first

    try {
      const newSession = await createSession(mandateId, catalogItemId);
      setSession(newSession);
      await runNegotiation(newSession.id); // returns instantly now, negotiation runs in background

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
            setThinkingActor(null); // always clear, regardless of turn-count logic above
            setLoading(false);
          }
        } catch (err) {
          clearInterval(pollRef.current);
          setLoading(false);
          setThinkingActor(null);
          setError('Lost connection while polling for updates.');
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
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-500 font-mono">
        Mandate: {mandateId} · Catalog Item: {catalogItemId}
      </div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Negotiation Theater</h2>

        {!session && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700"
          >
            {loading ? 'Negotiating...' : 'Start Negotiation'}
          </button>
        )}

        {isFinished && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
          >
            Start New Negotiation
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {session && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Session: {session.id}</span>
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${
                session.status === 'converged'
                  ? 'bg-green-100 text-green-800'
                  : session.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {session.status}
            </span>
          </div>
          {session.status === 'failed' && session.turns?.length > 0 && (
            <p className="text-sm text-red-700 mt-2">
              {session.turns[session.turns.length - 1].policy_result === 'blocked'
                ? session.turns[session.turns.length - 1].reason
                : session.turn_count >= 10
                ? 'No agreement was reached within the maximum number of negotiation rounds.'
                : 'The negotiation ended without an agreement.'}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {session?.turns?.map((turn, i) => (
          <div
            key={turn.id}
            className={`p-4 rounded-lg border ${ACTOR_STYLES[turn.actor]} animate-[fadeIn_0.3s_ease-in]`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
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

                {thinkingActor && (
          <div className={`p-4 rounded-lg border ${ACTOR_STYLES[thinkingActor]} opacity-60`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold capitalize">{thinkingActor} Vakil</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
              </span>
            </div>
          </div>
        )}

        {isFinished && (
          <div
            className={`p-4 rounded-lg border-2 border-dashed text-center ${
              session.status === 'converged'
                ? 'border-green-400 bg-green-50'
                : 'border-gray-400 bg-gray-50'
            }`}
          >
            {session.status === 'converged' ? (
              <>
                <span className="text-2xl">🤝</span>
                <p className="font-semibold text-green-800 mt-1">Deal reached</p>
              </>
            ) : (
              <>
                <span className="text-2xl">⏱️</span>
                <p className="font-semibold text-gray-700 mt-1">Negotiation ended without a deal</p>
                <p className="text-sm text-gray-500 mt-1">
                  {session.turns?.[session.turns.length - 1]?.policy_result === 'blocked'
                    ? session.turns[session.turns.length - 1].reason
                    : `Both sides negotiated in good faith for ${session.turn_count} rounds, but neither found terms they could agree to.`}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}