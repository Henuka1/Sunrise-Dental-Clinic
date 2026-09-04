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
    // Only an explicitly malformed/expired token (HTTP 401) from the backend
    // should log the user out. Network failures (no response), timeouts and
    // server errors (5xx) do NOT mean the session is bad — they can be
    // transient (e.g. a Railway container restarting). Logging out on those
    // causes the annoying "kicked back to login" flicker.
    const status = err.response?.status;

    if (status === 401) {
      // Don't auto-redirect on the login request itself — let the LoginPage
      // surface the credential error toast instead.
      const isLoginRequest = err.config?.url?.includes("/auth/login");
      if (!isLoginRequest) {
        // Diagnostic: log exactly which request triggered the 401 logout so we
        // can see whether it's a stale-token (backend restart) or a bad header.
        console.warn(
          "[api] 401 on",
          err.config?.method?.toUpperCase(),
          err.config?.url,
          "→ logging out"
        );
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = "/";
      }
    }

    return Promise.reject(err);
  }
);

export default api;
