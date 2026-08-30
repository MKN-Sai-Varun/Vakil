import { useState } from 'react';
import MandateEditor from './components/MandateEditor';
import CatalogEditor from './components/CatalogEditor';
import NegotiationTheater from './components/NegotiationTheater';
import LedgerList from './components/LedgerList';
import LedgerDetail from './components/LedgerDetail';

const SEED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111';

function App() {
  const [mandateId, setMandateId] = useState(null);
  const [catalogItemId, setCatalogItemId] = useState(null);
  const [view, setView] = useState('negotiate'); // 'negotiate' | 'ledger' | 'ledgerDetail'
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Vakil</h1>

      {view === 'negotiate' && (
        <div className="text-center mb-6">
          <button
            onClick={() => setView('ledger')}
            className="text-sm text-indigo-600 hover:underline"
          >
            View Deal Ledger →
          </button>
        </div>
      )}

      {view === 'negotiate' && (
        <>
          {!mandateId && <MandateEditor onCreated={setMandateId} />}
          {mandateId && !catalogItemId && (
            <CatalogEditor merchantId={SEED_MERCHANT_ID} onCreated={setCatalogItemId} />
          )}
          {mandateId && catalogItemId && (
            <NegotiationTheater mandateId={mandateId} catalogItemId={catalogItemId} />
          )}
        </>
      )}

      {view === 'ledger' && (
        <LedgerList
          onSelect={(id) => {
            setSelectedSessionId(id);
            setView('ledgerDetail');
          }}
          onBack={() => setView('negotiate')}
        />
      )}

      {view === 'ledgerDetail' && (
        <LedgerDetail sessionId={selectedSessionId} onBack={() => setView('ledger')} />
      )}
    </div>
  );
}

export default App;