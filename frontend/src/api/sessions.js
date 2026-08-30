import { api } from './client';

export async function createSession(mandateId, catalogItemId) {
  const res = await api.post('/sessions', {
    mandate_id: mandateId,
    catalog_item_id: catalogItemId,
  });
  return res.data;
}

export async function runNegotiation(sessionId) {
  const res = await api.post(`/sessions/${sessionId}/run`);
  return res.data;
}

export async function getSession(sessionId) {
  const res = await api.get(`/sessions/${sessionId}`);
  return res.data;
}