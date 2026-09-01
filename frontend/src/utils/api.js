import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "https://psycap.onrender.com/api" : "http://localhost:5000/api"),
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Authentication failed for API request");
    }
    return Promise.reject(error);
  },
);
export default api;
