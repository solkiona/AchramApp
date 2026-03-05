// src/services/apiClient.ts
import axios, { AxiosRequestConfig } from 'axios';


const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  (config) => {
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


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    
    if (error.response?.status === 401) {
      
      if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export { apiClient };