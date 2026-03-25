import axios from "axios";

const raw = import.meta.env.VITE_API_URL as string | undefined;
const API_URL =
  raw && raw.length > 0 ? raw.replace(/\/?$/, "/") : "http://localhost:8098/";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("accessToken");
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};
