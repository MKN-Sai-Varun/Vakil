export default function BuyerHome({ onStartNegotiation, onViewCatalog }) {
  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="mb-8">
        <h2 className="font-display text-3xl mb-2" style={{ color: 'var(--ink)' }}>
          Welcome, Buyer
        </h2>
        <p className="text-base" style={{ color: 'var(--ink-soft)' }}>
          Your AI agent is ready to negotiate on your behalf — set constraints, pick an item, and let it work.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <button
          onClick={onStartNegotiation}
          className="text-left p-6 rounded transition-all"
          style={{
            border: '2px solid var(--accent)',
            background: 'var(--paper-raised)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'var(--accent)', color: 'var(--paper-raised)' }}
            >
              ⚡
            </div>
            <h3 className="font-display text-lg" style={{ color: 'var(--accent)' }}>
              Start New Negotiation
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Set your mandate (budget and constraints) and let your Buyer Vakil negotiate the best deal.
          </p>
        </button>

        <button
          onClick={onViewCatalog}
          className="text-left p-6 rounded transition-all"
          style={{
            border: '1px solid var(--rule)',
            background: 'var(--paper-raised)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'var(--ink-soft)', color: 'var(--paper-raised)' }}
            >
              📦
            </div>
            <h3 className="font-display text-lg" style={{ color: 'var(--ink)' }}>
              Browse Catalog
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Explore available items from merchants with transparent pricing corridors.
          </p>
        </button>
      </div>

      {/* How Your Agent Works */}
      <div
        className="p-6 rounded mb-8"
        style={{
          border: '1px solid var(--rule)',
          background: 'var(--paper-raised)',
        }}
      >
        <h3 className="font-display text-lg mb-4" style={{ color: 'var(--ink)' }}>
          How Your Buyer Vakil Works
        </h3>
        <div className="space-y-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--accent)' }}>01</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Set Your Mandate</div>
              Define max total spend, max unit price, and desired quantity. Your agent can never exceed these bounds.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--accent)' }}>02</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Agent Negotiates</div>
              The Buyer Vakil proposes offers, counters merchant moves, and adjusts quantity to fit your budget.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--accent)' }}>03</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Policy Gate Verifies</div>
              Every move is checked against your mandate. If it would violate constraints, it's blocked or adjusted.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--accent)' }}>04</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Deal Settles</div>
              When both agents converge, a Razorpay order is created. Full audit trail shows every decision.
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded" style={{ background: 'var(--paper-raised)' }}>
          <div className="text-lg mb-2">🛡️</div>
          <div className="font-medium text-sm mb-1" style={{ color: 'var(--ink)' }}>
            Never Overspends
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
            Mandate gate blocks any deal that exceeds your budget or unit price ceiling.
          </p>
        </div>

        <div className="p-4 rounded" style={{ background: 'var(--paper-raised)' }}>
          <div className="text-lg mb-2">🔄</div>
          <div className="font-medium text-sm mb-1" style={{ color: 'var(--ink)' }}>
            Smart Adjustment
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
            If a deal would exceed budget, the agent automatically reduces quantity to fit.
          </p>
        </div>

        <div className="p-4 rounded" style={{ background: 'var(--paper-raised)' }}>
          <div className="text-lg mb-2">📊</div>
          <div className="font-medium text-sm mb-1" style={{ color: 'var(--ink)' }}>
            Full Transparency
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
            Every turn shows rationale, gate results, and verification status in the ledger.
          </p>
        </div>
      </div>
    </div>
  );
}
