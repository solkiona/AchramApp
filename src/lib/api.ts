// src/lib/api.ts
import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const isNative = Capacitor.isNativePlatform();

interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  details?: Record<string, string[]>;
}

const buildHeaders = async (
  token?: string,
  isGuest = false,
  guestId?: string,
  isFormData = false,
  isAuthRequest = false
) => {
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let effectiveToken = token;

  // Native Model 1: read vault token for auth requests if caller did not pass one
  if (isNative && isAuthRequest && !effectiveToken) {
    try {
      const stored = await SecureStorage.get('auth_token');
      if (stored) effectiveToken = stored;
    } catch {}
  }

  // Web: keep cookie-first behavior, only add Authorization when not a cookie request
  // Native: always send Bearer for auth requests
  if (effectiveToken && (!isAuthRequest || isNative)) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  if (isGuest && guestId) {
    headers['X-Guest-Id'] = guestId;
  }

  return headers;
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
      const headers = await buildHeaders(token, isGuestRequest, guestId, false, isAuthRequest);

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      };

      if (isAuthRequest) {
        fetchOptions.credentials = isNative ? 'omit' : 'include';
      }

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
      const responseData = await res.json();

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
      const headers = await buildHeaders(token, isGuest, guestId, false, isAuthRequest);

      const fetchOptions: RequestInit = { headers };

      if (isAuthRequest) {
        fetchOptions.credentials = isNative ? 'omit' : 'include';
      }

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
      const responseData = await res.json();

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
      const headers = await buildHeaders(token, false, undefined, isFormData, isAuthRequest);

      const fetchOptions: RequestInit = {
        method: 'PATCH',
        headers,
        body: isFormData ? data : JSON.stringify(data),
      };

      if (isAuthRequest) {
        fetchOptions.credentials = isNative ? 'omit' : 'include';
      }

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
      const responseData = await res.json();

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
      const headers = await buildHeaders(token, false, undefined, false, isAuthRequest);

      const fetchOptions: RequestInit = {
        method: 'DELETE',
        headers,
      };

      if (isAuthRequest) {
        fetchOptions.credentials = isNative ? 'omit' : 'include';
      }

      const res = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
      const responseData = await res.json();

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




// // src/lib/api.ts
// // const API_BASE = 'https://api.achrams.com.ng/v1'; // Corrected trailing space
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE

// interface ApiResponse<T = unknown> {
//   status: 'success' | 'error';
//   message: string;
//   data?: T;
//   details?: Record<string, string[]>;
// }

// // NEW: Updated buildHeaders to correctly handle the new parameter flow
// // It should NOT add Authorization header for requests intended to use cookies IF the backend relies solely on cookies.
// // It SHOULD add X-Guest-Id for guest requests.
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

//   // NEW: Add Authorization header only if:
//   // 1. A token is provided AND {undefined, false, undefined, false, true}
//   // 2. It's NOT an authenticated request relying on cookies (isAuthRequest is false) OR
//   // 3. The backend is configured to check both (less common, but possible)
//   // For cookie-based auth, the header is often omitted.
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













