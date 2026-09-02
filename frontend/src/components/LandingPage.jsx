import { useState } from 'react';
import AuthPage from './AuthPage';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return (
      <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>Vakil</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-soft)' }}>
              Bounded AI-to-AI Commerce
            </p>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            className="text-sm px-4 py-2 rounded"
            style={{ background: 'var(--accent)', color: 'var(--paper-raised)' }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="font-display text-4xl mb-4" style={{ color: 'var(--ink)' }}>
          AI Agents That Negotiate, Bounded by Policy
        </h2>
        <p className="text-lg mb-12 max-w-2xl mx-auto" style={{ color: 'var(--ink-soft)' }}>
          Two autonomous agents negotiate price, quantity, and bundles in real-time — each bounded by constraints they can never break. Every decision is explainable, every action is audited.
        </p>

        {/* Value Props Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              ⚖️
            </div>
            <h3 className="font-display text-lg mb-2" style={{ color: 'var(--ink)' }}>
              Provably Bounded
            </h3>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              Policy gates verify every move. Agents can't exceed mandates, sell below floor, or break discount budgets.
            </p>
          </div>

          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl"
              style={{ background: 'var(--ochre-soft)', color: 'var(--ochre)' }}
            >
              📋
            </div>
            <h3 className="font-display text-lg mb-2" style={{ color: 'var(--ink)' }}>
              Full Audit Trail
            </h3>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              Every turn logged with rationale. See exactly why each agent made each move, and how gates adjusted proposals.
            </p>
          </div>

          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl"
              style={{ background: 'var(--moss-soft)', color: 'var(--moss)' }}
            >
              💳
            </div>
            <h3 className="font-display text-lg mb-2" style={{ color: 'var(--ink)' }}>
              Real Settlement
            </h3>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              Razorpay orders created on convergence. Live webhook integration for payment capture and refunds.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div
          className="max-w-3xl mx-auto p-8 rounded mb-12 text-left"
          style={{ border: '1px solid var(--rule)', background: 'var(--paper-raised)' }}
        >
          <h3 className="font-display text-xl mb-6 text-center" style={{ color: 'var(--ink)' }}>
            How It Works
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
                <h4 className="font-display text-base" style={{ color: 'var(--accent)' }}>
                  Buyer Vakil
                </h4>
              </div>
              <ul className="text-sm space-y-2" style={{ color: 'var(--ink-soft)' }}>
                <li>• Set a mandate: max spend, max unit price, desired quantity</li>
                <li>• Agent negotiates autonomously within those bounds</li>
                <li>• Never exceeds budget or unit price ceiling</li>
                <li>• Auto-reduces quantity to fit constraints</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--ochre)' }}
                />
                <h4 className="font-display text-base" style={{ color: 'var(--ochre)' }}>
                  Merchant Vakil
                </h4>
              </div>
              <ul className="text-sm space-y-2" style={{ color: 'var(--ink-soft)' }}>
                <li>• Set pricing corridor: list price and floor price</li>
                <li>• Agent negotiates freely within the corridor</li>
                <li>• Never sells below floor or over discount budget</li>
                <li>• Offers volume bundles when conditions are met</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--rule)' }}>
            <div className="flex items-center justify-between text-sm">
              <div className="text-center flex-1">
                <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>1. Propose</div>
                <p style={{ color: 'var(--ink-soft)' }}>LLM decides move</p>
              </div>
              <div className="text-ink-soft">→</div>
              <div className="text-center flex-1">
                <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>2. Verify</div>
                <p style={{ color: 'var(--ink-soft)' }}>Gate checks policy</p>
              </div>
              <div className="text-ink-soft">→</div>
              <div className="text-center flex-1">
                <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>3. Settle</div>
                <p style={{ color: 'var(--ink-soft)' }}>Order created</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setShowAuth(true)}
          className="text-base px-8 py-3 rounded font-medium"
          style={{ background: 'var(--accent)', color: 'var(--paper-raised)' }}
        >
          Try It Now
        </button>

        <p className="text-xs mt-8" style={{ color: 'var(--ink-soft)', opacity: 0.7 }}>
          Built for Razorpay Hackathon Track 01: AI Growth & Agentic Commerce
        </p>
      </div>
    </div>
  );
}
