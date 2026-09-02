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
import LandingPage from './components/LandingPage';
import BuyerHome from './components/BuyerHome';
import MerchantHome from './components/MerchantHome';
import { useAuth } from './auth/AuthContext';
import { getMyMerchant } from './api/merchants';

// Buyer views:  'home' | 'mandate' | 'catalog-pick' | 'negotiate' | 'catalog-browse'
// Merchant views: 'home' | 'dashboard' | 'list-item'
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
    setView('home');
    if (user.role === 'merchant') {
      setMerchantLoading(true);
      getMyMerchant()
        .then((m) => setMerchantId(m.id))
        .catch(() => setMerchantError('Could not load your merchant profile.'))
        .finally(() => setMerchantLoading(false));
    }
  }, [user]);

  if (checking || (user && view === null)) {
    return <div className="min-h-screen" style={{ background: 'var(--paper)' }} />;
  }

  if (!user) {
    return <LandingPage />;
  }

  // ── nav helpers ──────────────────────────────────────────────────────────────

  function goToHome() {
    setView('home');
  }

  function handleGetStarted() {
    if (user.role === 'buyer') setView('mandate');
    else setView('list-item');
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
  const isOnWorkTab = isBuyer ? buyerViews.includes(view) : merchantViews.includes(view);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          {/* Top row: Logo left, user info + sign out right */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>Vakil</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                Bounded AI-to-AI Commerce
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>
                {user.display_name} · {user.role}
              </p>
              <button onClick={logoutUser} className="text-xs" style={{ color: 'var(--ink-soft)', opacity: 0.8 }}>
                Sign out →
              </button>
            </div>
          </div>

          {/* Nav row */}
          <nav className="flex items-center gap-6">
            <button
              onClick={goToHome}
              className="text-sm pb-1"
              style={{
                color: view === 'home' ? 'var(--ink)' : 'var(--ink-soft)',
                borderBottom: view === 'home' ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              Home
            </button>

            <button
              onClick={() => isBuyer ? setView(buyerStep) : setView('dashboard')}
              className="text-sm pb-1"
              style={{
                color: isOnWorkTab ? 'var(--ink)' : 'var(--ink-soft)',
                borderBottom: isOnWorkTab ? '2px solid var(--accent)' : '2px solid transparent',
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
          </nav>
        </div>
      </header>

      <main className="py-10">

        {/* ── Home page ──────────────────────────────────────────────────────── */}
        {view === 'home' && isBuyer && (
          <BuyerHome
            onStartNegotiation={() => setView('mandate')}
            onViewCatalog={() => setView('catalog-browse')}
          />
        )}
        {view === 'home' && !isBuyer && (
          <MerchantHome
            onViewDashboard={() => setView('dashboard')}
            onListItem={() => setView('list-item')}
          />
        )}

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
