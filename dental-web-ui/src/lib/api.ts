import axios, { AxiosError } from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "./constants";

const baseURL = import.meta.env.VITE_API_BASE_URL || API_BASE_URL;

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token && config.headers) {
    if (token.startsWith("Bearer ")) {
      config.headers.Authorization = token;
    } else if (token.startsWith("Bearer-")) {
      config.headers.Authorization = `Bearer ${token.slice(7)}`;
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;
