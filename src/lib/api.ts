
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE

// interface ApiResponse<T = unknown> {
//   status: 'success' | 'error';
//   message: string;
//   data?: T;
//   details?: Record<string, string[]>;
// }

// const buildHeaders = (
//   token?: string, // Token for Bearer header (used if isAuthRequest is false or if backend checks both)
//   isGuest = false,
//   guestId?: string,
//   isFormData = false,
//   isAuthRequest = false // NEW: Flag indicating if this request relies on httpOnly cookie
// ) => {
//   const headers: Record<string, string> = {};

//   if (!isFormData) {
//     headers['Content-Type'] = 'application/json';
//   }

//   if (token && !isAuthRequest) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   // Add X-Guest-Id header if it's a guest request
//   if (isGuest && guestId) {
//     headers['X-Guest-Id'] = guestId;
//   }

//   return headers;
// };

// export const apiClient = {
//   post: async <T = unknown>(
//     endpoint: string,
//     data: unknown,
//     token?: string, // Token for Bearer header (if not using cookie)
//     guestId?: string,
//     isAuthRequest = false // NEW: Flag for cookie-based requests
//   ): Promise<ApiResponse<T>> => {
//     const isGuestRequest = endpoint.includes('/guest-booking') ||
//                           endpoint.includes('/cancel') || // Note: This could be for guest or auth user depending on context
//                           endpoint.includes('/rate') ||   // Note: This could be for guest or auth user depending on context
//                           guestId !== undefined;

//     try {
//       // NEW: Prepare fetch options
//       const fetchOptions: RequestInit = {
//         method: 'POST',
//         headers: buildHeaders(token, isGuestRequest, guestId, false, isAuthRequest), // Pass isAuthRequest to buildHeaders
//         body: JSON.stringify(data),
//       };

//       // NEW: Add credentials if the request is for an authenticated user (relies on cookie)
//       if (isAuthRequest) {
//         fetchOptions.credentials = 'include';
//       }

//       const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

//       const responseData = await res.json();

//       if (!res.ok) {
//         return {
//           status: 'error',
//           message: responseData.message || `HTTP error! status: ${res.status}`,
//           details: responseData.details,
//         };
//       }

//       return responseData;
//     } catch (error) {
//       console.error('API POST Error:', error);
//       return {
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Network error',
//       };
//     }
//   },

//   get: async <T = unknown>(
//     endpoint: string,
//     token?: string, // Token for Bearer header (if not using cookie)
//     isGuest = false,
//     guestId?: string,
//     isAuthRequest = false // NEW: Flag for cookie-based requests
//   ): Promise<ApiResponse<T>> => {
//     try {
//       // NEW: Prepare fetch options
//       const fetchOptions: RequestInit = {
//         headers: buildHeaders(token, isGuest, guestId, false, isAuthRequest), // Pass isAuthRequest to buildHeaders
//       };

//       // NEW: Add credentials if the request is for an authenticated user (relies on cookie)
//       if (isAuthRequest) {
//         fetchOptions.credentials = 'include';
//       }

//       const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

//       const responseData = await res.json();

//       if (!res.ok) {
//         return {
//           status: 'error',
//           message: responseData.message || `HTTP error! status: ${res.status}`,
//           details: responseData.details,
//         };
//       }

//       return responseData;
//     } catch (error) {
//       console.error('API GET Error:', error);
//       return {
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Network error',
//       };
//     }
//   },

//   patch: async <T = unknown>(
//     endpoint: string,
//     data: FormData | Record<string, unknown>,
//     token?: string, // Token for Bearer header (if not using cookie)
//     isAuthRequest = false // NEW: Flag for cookie-based requests
//   ): Promise<ApiResponse<T>> => {
//     const isFormData = data instanceof FormData;

//     try {
//       // NEW: Prepare fetch options
//       const fetchOptions: RequestInit = {
//         method: 'PATCH',
//         headers: buildHeaders(token, false, undefined, isFormData, isAuthRequest), // Pass isAuthRequest to buildHeaders
//         body: isFormData ? data : JSON.stringify(data),
//       };

//       // NEW: Add credentials if the request is for an authenticated user (relies on cookie)
//       if (isAuthRequest) {
//         fetchOptions.credentials = 'include';
//       }

//       const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

//       const responseData = await res.json();

//       if (!res.ok) {
//         return {
//           status: 'error',
//           message: responseData.message || `HTTP error! status: ${res.status}`,
//           details: responseData.details,
//         };
//       }

//       return responseData;
//     } catch (error) {
//       console.error('API PATCH Error:', error);
//       return {
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Network error',
//       };
//     }
//   },

//   delete: async <T = unknown>(
//     endpoint: string,
//     token?: string, // Token for Bearer header (if not using cookie)
//     isAuthRequest = false // NEW: Flag for cookie-based requests
//   ): Promise<ApiResponse<T>> => {
//     try {
//       // NEW: Prepare fetch options
//       const fetchOptions: RequestInit = {
//         method: 'DELETE',
//         headers: buildHeaders(token, false, undefined, false, isAuthRequest), // Pass isAuthRequest to buildHeaders
//       };

//       // NEW: Add credentials if the request is for an authenticated user (relies on cookie)
//       if (isAuthRequest) {
//         fetchOptions.credentials = 'include';
//       }

//       const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

//       const responseData = await res.json();

//       if (!res.ok) {
//         return {
//           status: 'error',
//           message: responseData.message || `HTTP error! status: ${res.status}`,
//         };
//       }

//       return responseData;
//     } catch (error) {
//       console.error('API DELETE Error:', error);
//       return {
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Network error',
//       };
//     }
//   },
// };


// src/lib/api.ts
import { Capacitor } from '@capacitor/core';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const isNative = Capacitor.isNativePlatform();

interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  details?: Record<string, string[]>;
}

let onUnauthorized: (() => Promise<void>) | null = null;
export const setUnauthorizedHandler = (handler: () => Promise<void>) => {
  onUnauthorized = handler;
};
const handleUnauthorized = () => { onUnauthorized?.(); };

const buildHeaders = (
  token?: string,
  isGuest = false,
  guestId?: string,
  isFormData = false,
  isAuthRequest = false
): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (!isFormData) headers['Content-Type'] = 'application/json';

  // Native → Bearer token from memory (never touches Keychain)
  // Web   → no Authorization header, cookie handles it
  if (token && (isNative || !isAuthRequest)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (isGuest && guestId) headers['X-Guest-Id'] = guestId;

  return headers;
};

const getCredentials = (isAuthRequest: boolean): RequestCredentials | undefined => {
  if (!isAuthRequest) return undefined;
  // Android localhost origin — cookies work with include
  // iOS real origin — omit cookies, use Bearer token instead
  return isNative ? 'omit' : 'include';
};

export const apiClient = {
  post: async <T = unknown>(
    endpoint: string,
    data: unknown,
    token?: string,
    guestId?: string,
    isAuthRequest = false
  ): Promise<ApiResponse<T>> => {
    const isGuestRequest =
      endpoint.includes('/guest-booking') ||
      endpoint.includes('/cancel') ||
      endpoint.includes('/rate') ||
      guestId !== undefined;

    try {
      const credentials = getCredentials(isAuthRequest);
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: buildHeaders(token, isGuestRequest, guestId, false, isAuthRequest),
        body: JSON.stringify(data),
        ...(credentials && { credentials }),
      };

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      if (res.status === 401) {
        handleUnauthorized();
        return { status: 'error', message: 'Unauthorized' };
      }

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'error',
          message: responseData.message || `HTTP error! status: ${res.status}`,
          details: responseData.details,
        };
      }
      return responseData;
    } catch (error) {
      console.error('API POST Error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  get: async <T = unknown>(
    endpoint: string,
    token?: string,
    isGuest = false,
    guestId?: string,
    isAuthRequest = false
  ): Promise<ApiResponse<T>> => {
    try {
      const credentials = getCredentials(isAuthRequest);
      const fetchOptions: RequestInit = {
        headers: buildHeaders(token, isGuest, guestId, false, isAuthRequest),
        ...(credentials && { credentials }),
      };

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      if (res.status === 401) {
        handleUnauthorized();
        return { status: 'error', message: 'Unauthorized' };
      }

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'error',
          message: responseData.message || `HTTP error! status: ${res.status}`,
          details: responseData.details,
        };
      }
      return responseData;
    } catch (error) {
      console.error('API GET Error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  patch: async <T = unknown>(
    endpoint: string,
    data: FormData | Record<string, unknown>,
    token?: string,
    isAuthRequest = false
  ): Promise<ApiResponse<T>> => {
    const isFormData = data instanceof FormData;
    try {
      const credentials = getCredentials(isAuthRequest);
      const fetchOptions: RequestInit = {
        method: 'PATCH',
        headers: buildHeaders(token, false, undefined, isFormData, isAuthRequest),
        body: isFormData ? data : JSON.stringify(data),
        ...(credentials && { credentials }),
      };

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      if (res.status === 401) {
        handleUnauthorized();
        return { status: 'error', message: 'Unauthorized' };
      }

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'error',
          message: responseData.message || `HTTP error! status: ${res.status}`,
          details: responseData.details,
        };
      }
      return responseData;
    } catch (error) {
      console.error('API PATCH Error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  delete: async <T = unknown>(
    endpoint: string,
    token?: string,
    isAuthRequest = false
  ): Promise<ApiResponse<T>> => {
    try {
      const credentials = getCredentials(isAuthRequest);
      const fetchOptions: RequestInit = {
        method: 'DELETE',
        headers: buildHeaders(token, false, undefined, false, isAuthRequest),
        ...(credentials && { credentials }),
      };

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      if (res.status === 401) {
        handleUnauthorized();
        return { status: 'error', message: 'Unauthorized' };
      }

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'error',
          message: responseData.message || `HTTP error! status: ${res.status}`,
        };
      }
      return responseData;
    } catch (error) {
      console.error('API DELETE Error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  },
};

