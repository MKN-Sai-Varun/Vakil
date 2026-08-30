import { useState } from 'react';
import MandateEditor from './components/MandateEditor';
import CatalogEditor from './components/CatalogEditor';
import NegotiationTheater from './components/NegotiationTheater';

const SEED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111';

function App() {
  const [mandateId, setMandateId] = useState(null);
  const [catalogItemId, setCatalogItemId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Vakil</h1>

      {!mandateId && <MandateEditor onCreated={setMandateId} />}
      {mandateId && !catalogItemId && (
        <CatalogEditor merchantId={SEED_MERCHANT_ID} onCreated={setCatalogItemId} />
      )}
      {mandateId && catalogItemId && (
        <NegotiationTheater mandateId={mandateId} catalogItemId={catalogItemId} />
      )}
    </div>
  );
}

export default App;