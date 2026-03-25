import axios from "axios";
import { useAuthStore } from "../store/auth-store";

// Use NEXT_PUBLIC_SERVER_URL or fallback to 5000 (where your Express server is)
const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

const AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Crucial for sending the HttpOnly refresh cookie
});

// REQUEST INTERCEPTOR: Attach memory token to headers
AxiosInstance.interceptors.request.use((config) => {
  // Grab the token directly from Zustand's state
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// RESPONSE INTERCEPTOR: Handle 401s and token refresh
AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return AxiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Hit the refresh route we built in Express
        const { data } = await axios.get(`${BASE_URL}/users/refresh`, {
          withCredentials: true,
        });

        // Save the new token into the Zustand memory store
        useAuthStore.getState().setAccessToken(data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);

        return AxiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Wipe memory and redirect if refresh fails
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/signup?error=SessionExpired";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default AxiosInstance;
