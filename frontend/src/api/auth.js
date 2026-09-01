import { api } from './client';

export async function signup(email, password, role, display_name) {
  const res = await api.post('/auth/signup', { email, password, role, display_name });
  return res.data;
}

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function getMe(token) {
  const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}