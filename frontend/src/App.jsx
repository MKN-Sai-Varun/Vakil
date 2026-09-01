import { useState, useEffect } from 'react';
import MandateEditor from './components/MandateEditor';
import CatalogEditor from './components/CatalogEditor';
import MerchantDashboard from './components/MerchantDashboard';
import NegotiationTheater from './components/NegotiationTheater';
import LedgerList from './components/LedgerList';
import LedgerDetail from './components/LedgerDetail';
import AuthPage from './components/AuthPage';
import BuyerCatalogPicker from './components/BuyerCatalogPicker';
import CatalogBrowser from './components/CatalogBrowser';
import { useAuth } from './auth/AuthContext';
import { getMyMerchant } from './api/merchants';

// Buyer views:  'mandate' | 'catalog-pick' | 'negotiate' | 'catalog-browse'
// Merchant views: 'dashboard' | 'list-item'
// Shared:       'ledger' | 'ledgerDetail'

function App() {
  const { user, checking, logoutUser } = useAuth();

  // Buyer state
  const [mandateId, setMandateId] = useState(null);
  const [mandate, setMandate] = useState(null);
  const [catalogItemId, setCatalogItemId] = useState(null);

  // Merchant state
  const [merchantId, setMerchantId] = useState(null);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [merchantError, setMerchantError] = useState(null);

  // Navigation
  const [view, setView] = useState(null); // set properly once user loads
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const buyerStep = !mandateId ? 'mandate' : !catalogItemId ? 'catalog-pick' : 'negotiate';

  useEffect(() => {
    if (!user) return;
    if (user.role === 'merchant') {
      setView('dashboard');
      setMerchantLoading(true);
      getMyMerchant()
        .then((m) => setMerchantId(m.id))
        .catch(() => setMerchantError('Could not load your merchant profile.'))
        .finally(() => setMerchantLoading(false));
    } else {
      setView('mandate');
    }
  }, [user]);

  if (checking || (user && view === null)) {
    return <div className="min-h-screen" style={{ background: 'var(--paper)' }} />;
  }

  if (!user) {
    return (
      <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
        <AuthPage />
      </div>
    );
  }

  // ── nav helpers ──────────────────────────────────────────────────────────────

  function goToHome() {
    if (user.role === 'buyer') setView(buyerStep);
    else setView('dashboard');
  }

  function handleMandateCreated(id, mandateData) {
    setMandateId(id);
    setMandate(mandateData);
    setView('catalog-pick');
  }

  function handleCatalogItemSelected(id) {
    setCatalogItemId(id);
    setView('negotiate');
  }

  function handleBackToMandate() {
    setMandateId(null);
    setMandate(null);
    setCatalogItemId(null);
    setView('mandate');
  }

  function handleNewNegotiation() {
    setCatalogItemId(null);
    setView('catalog-pick');
  }

  // ── derived state ────────────────────────────────────────────────────────────

  const isBuyer = user.role === 'buyer';
  const buyerViews = ['mandate', 'catalog-pick', 'negotiate'];
  const merchantViews = ['dashboard', 'list-item'];
  const isOnHomeTab = isBuyer ? buyerViews.includes(view) : merchantViews.includes(view);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>Vakil</h1>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              {user.display_name} · {user.role}
            </p>
          </div>
          <nav className="flex items-center gap-6">
            <button
              onClick={goToHome}
              className="text-sm pb-1"
              style={{
                color: isOnHomeTab ? 'var(--ink)' : 'var(--ink-soft)',
                borderBottom: isOnHomeTab ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {isBuyer ? 'Negotiate' : 'Inventory'}
            </button>

            {isBuyer && (
              <button
                data-nav="catalog-browse"
                onClick={() => setView('catalog-browse')}
                className="text-sm pb-1"
                style={{
                  color: view === 'catalog-browse' ? 'var(--ink)' : 'var(--ink-soft)',
                  borderBottom: view === 'catalog-browse' ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                Catalog
              </button>
            )}

            <button
              onClick={() => setView('ledger')}
              className="text-sm pb-1"
              style={{
                color: view === 'ledger' || view === 'ledgerDetail' ? 'var(--ink)' : 'var(--ink-soft)',
                borderBottom: view === 'ledger' || view === 'ledgerDetail' ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              Ledger
            </button>

            <button onClick={logoutUser} className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="py-10">

        {/* ── Buyer flow ─────────────────────────────────────────────────────── */}
        {isBuyer && view === 'mandate' && (
          <MandateEditor onCreated={handleMandateCreated} />
        )}
        {isBuyer && view === 'catalog-pick' && (
          <BuyerCatalogPicker
            mandate={mandate}
            onSelect={handleCatalogItemSelected}
            onBack={handleBackToMandate}
          />
        )}
        {isBuyer && view === 'negotiate' && (
          <NegotiationTheater
            mandateId={mandateId}
            catalogItemId={catalogItemId}
            mandate={mandate}
            onChangeItem={() => setView('catalog-pick')}
            onNewNegotiation={handleNewNegotiation}
          />
        )}
        {isBuyer && view === 'catalog-browse' && <CatalogBrowser />}

        {/* ── Merchant flow ──────────────────────────────────────────────────── */}
        {!isBuyer && view === 'dashboard' && (
          <>
            {merchantLoading && (
              <p className="text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
                Loading your merchant profile…
              </p>
            )}
            {merchantError && (
              <p className="text-center text-sm" style={{ color: 'var(--rust)' }}>{merchantError}</p>
            )}
            {!merchantLoading && !merchantError && (
              <MerchantDashboard onListNew={() => setView('list-item')} />
            )}
          </>
        )}
        {!isBuyer && view === 'list-item' && merchantId && (
          <CatalogEditor
            merchantId={merchantId}
            onCreated={() => setView('dashboard')}
          />
        )}

        {/* ── Shared: Ledger ─────────────────────────────────────────────────── */}
        {view === 'ledger' && (
          <LedgerList
            onSelect={(id) => { setSelectedSessionId(id); setView('ledgerDetail'); }}
            onBack={goToHome}
          />
        )}
        {view === 'ledgerDetail' && (
          <LedgerDetail
            sessionId={selectedSessionId}
            onBack={() => setView('ledger')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
