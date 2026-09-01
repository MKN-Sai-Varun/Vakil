import { api } from './client';

export async function getMyMerchant() {
  const res = await api.get('/merchants/me');
  return res.data;
}

export async function getMerchantDashboard() {
  const res = await api.get('/merchants/me/dashboard');
  return res.data;
}