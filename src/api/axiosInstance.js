import axios from "axios";

// Single Axios instance used across the whole app. Every service module
// (authService, and future projectService/bugService/etc.) imports this
// instead of creating its own axios client.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// The backend returns evidence image URLs as relative paths
// (e.g. "/uploads/bugs/<uuid>.png", see app/services/image_storage.py).
// This turns that into an absolute URL an <img src> can load directly.
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Attach the JWT (if present) to every outgoing request.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("bugpilot_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // The instance default above sets Content-Type: application/json for
  // convenience on normal JSON requests. But for file uploads (FormData
  // bodies, e.g. the AI Bug Generator's screenshot upload), that default
  // header wins over axios's own multipart handling and the browser
  // never gets to set the `multipart/form-data; boundary=...` header
  // itself. FastAPI then can't parse the multipart body at all and
  // returns 422 (missing required file/form fields). Deleting the
  // header here for FormData requests lets the browser set the correct
  // Content-Type + boundary automatically.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// If the token is invalid/expired, the API returns 401. Clear local
// auth state and bounce the user back to /login.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("bugpilot_token");
      localStorage.removeItem("bugpilot_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;