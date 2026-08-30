import { useState } from 'react';
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

export default function NegotiationTheater({ mandateId, catalogItemId }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFinished = session && (session.status === 'converged' || session.status === 'failed');

  async function handleStart() {
    setError(null);
    setLoading(true);
    try {
      const newSession = await createSession(mandateId, catalogItemId);
      setSession(newSession);
      await runNegotiation(newSession.id);
      const fullSession = await getSession(newSession.id);
      setSession(fullSession);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSession(null);
    setError(null);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
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
          <span className="text-sm text-gray-500">Session: {session.id}</span>
          <span
            className={`ml-3 px-2 py-1 rounded text-sm font-medium ${
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
      )}

      <div className="space-y-3">
        {session?.turns?.map((turn) => (
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
    </div>
  );
}