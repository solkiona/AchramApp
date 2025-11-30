// src/services/apiClient.ts
import axios, { AxiosRequestConfig } from 'axios';

// NEW: Create an axios instance
const apiClient = axios.create({
  baseURL: 'https://api.achrams.com.ng', // NEW: Use the correct base URL from passenger postman DOC.txt
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// NEW: Request interceptor to add Bearer token if available
apiClient.interceptors.request.use(
  (config) => {
    // NEW: Get token from where you store it (e.g., localStorage, cookie via httpOnly)
    // For this example, assuming it's in localStorage under 'auth_token'
    // For better security, consider storing the token in an httpOnly cookie.
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// NEW: Response interceptor (optional, for handling errors globally)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific status codes (e.g., 401 for unauthorized)
    if (error.response?.status === 401) {
      // NEW: Clear token and potentially redirect
      if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
      }
      // Dispatch an action to update auth state if using a global state manager
      // Or use router.push('/auth/login') if using Next.js router
      // window.location.href = '/auth/login'; // Or dispatch an action to update auth state
    }
    return Promise.reject(error);
  }
);

export default apiClient;
// Export the instance to be used in components
export { apiClient };