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
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const rawBase = import.meta.env.BASE_URL || "/";
    const pathPart = rawBase.replace(/\/?$/, "");
    const base = pathPart ? `${origin}${pathPart}` : origin;
    const normalized = base.replace(/\/+$/, "") || origin;
    config.headers["X-Frontend-Base-URL"] = normalized;
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
