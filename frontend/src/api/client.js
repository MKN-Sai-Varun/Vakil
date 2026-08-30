import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});