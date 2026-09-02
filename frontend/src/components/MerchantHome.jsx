export default function MerchantHome({ onViewDashboard, onListItem }) {
  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="mb-8">
        <h2 className="font-display text-3xl mb-2" style={{ color: 'var(--ink)' }}>
          Welcome, Merchant
        </h2>
        <p className="text-base" style={{ color: 'var(--ink-soft)' }}>
          Your AI agent handles negotiations automatically — set pricing corridors and let it maximize revenue within bounds.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <button
          onClick={onListItem}
          className="text-left p-6 rounded transition-all"
          style={{
            border: '2px solid var(--ochre)',
            background: 'var(--paper-raised)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'var(--ochre)', color: 'var(--paper-raised)' }}
            >
              ➕
            </div>
            <h3 className="font-display text-lg" style={{ color: 'var(--ochre)' }}>
              List New Item
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Add inventory with pricing corridor (list price and floor price). Your Merchant Vakil will negotiate within these bounds.
          </p>
        </button>

        <button
          onClick={onViewDashboard}
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
              📊
            </div>
            <h3 className="font-display text-lg" style={{ color: 'var(--ink)' }}>
              View Dashboard
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            See your full inventory, active negotiations, and performance metrics.
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
          How Your Merchant Vakil Works
        </h3>
        <div className="space-y-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--ochre)' }}>01</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Define Pricing Corridor</div>
              Set list price (ceiling) and floor price (minimum). Your agent negotiates freely within this range.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--ochre)' }}>02</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Set Daily Budget</div>
              Define daily discount budget. The agent can offer discounts but never exceeds the daily limit.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--ochre)' }}>03</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Agent Negotiates</div>
              The Merchant Vakil counters buyer offers, adjusts prices strategically, and offers volume bundles when appropriate.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--ochre)' }}>04</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Policy Gate Enforces</div>
              Every move is verified against floor price, inventory, and discount budget. Violations are blocked or adjusted.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono-data" style={{ color: 'var(--ochre)' }}>05</span>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Revenue Captured</div>
              On convergence, Razorpay order is created. Inventory decrements, discount budget updates, full audit logged.
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded" style={{ background: 'var(--paper-raised)' }}>
          <div className="text-lg mb-2">🔒</div>
          <div className="font-medium text-sm mb-1" style={{ color: 'var(--ink)' }}>
            Never Below Floor
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
            Policy gate blocks any deal that would sell below your floor price, protecting margins.
          </p>
        </div>

        <div className="p-4 rounded" style={{ background: 'var(--paper-raised)' }}>
          <div className="text-lg mb-2">📦</div>
          <div className="font-medium text-sm mb-1" style={{ color: 'var(--ink)' }}>
            Smart Bundles
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
            Agent automatically offers volume discounts when conditions are met (e.g., 10+ units).
          </p>
        </div>

        <div className="p-4 rounded" style={{ background: 'var(--paper-raised)' }}>
          <div className="text-lg mb-2">💰</div>
          <div className="font-medium text-sm mb-1" style={{ color: 'var(--ink)' }}>
            Budget Control
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
            Daily discount budget ensures you never over-discount. Resets every 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
