import { api } from './client';

export async function getLedgerList() {
  const res = await api.get('/ledger');
  return res.data;
}

export async function getLedgerDetail(sessionId) {
  const res = await api.get(`/ledger/${sessionId}`);
  return res.data;
}