import axios from 'axios';

// Aponte para a porta 8000 (ou a porta que seu Uvicorn está usando)
// Removido o prefixo /api
const API_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};