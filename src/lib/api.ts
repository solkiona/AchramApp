// src/lib/api.ts
const API_BASE = 'https://api.achrams.com.ng/v1';

interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  details?: Record<string, string[]>;
}

const buildHeaders = (
  token?: string,
  isGuest = false,
  guestId?: string,
  isFormData = false
) => {
  const headers: Record<string, string> = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
    guestId?: string
  ): Promise<ApiResponse<T>> => {
    const isGuestRequest = endpoint.includes('/guest-booking') || 
                          endpoint.includes('/cancel') || 
                          endpoint.includes('/rate') ||
                          guestId !== undefined;
    
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: buildHeaders(token, isGuestRequest, guestId),
        body: JSON.stringify(data),
      });

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
    isGuest = false,
    guestId?: string,
    token?: string
  ): Promise<ApiResponse<T>> => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: buildHeaders(token, isGuest, guestId),
      });

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
    token?: string
  ): Promise<ApiResponse<T>> => {
    const isFormData = data instanceof FormData;
    
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: buildHeaders(token, false, undefined, isFormData),
        body: isFormData ? data : JSON.stringify(data),
      });

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
    token?: string
  ): Promise<ApiResponse<T>> => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: buildHeaders(token),
      });

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


// src/lib/api.ts
// const API_BASE = 'https://api.achrams.com.ng/v1';

// // Define the generic API response structure
// interface ApiResponse<T = unknown> {
//   status: 'success' | 'error';
//   message: string;
//    T;
// }

// const buildHeaders = (token?: string, isGuest = false, guestId?: string) => {
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//   };
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }
//   if (isGuest && guestId) {
//     headers['X-Guest-Id'] = guestId;
//   }
//   return headers;
// };

// export const apiClient = {
//   post: async <T = unknown>(
//     endpoint: string,
//     data: unknown,
//     token?: string,
//     guestId?: string
//   ): Promise<ApiResponse<T>> => {
//     const isGuestRequest = endpoint.includes('/guest-booking') || guestId !== undefined;
//     const res = await fetch(`${API_BASE}${endpoint}`, {
//       method: 'POST',
//       headers: buildHeaders(token, isGuestRequest, guestId),
//       body: JSON.stringify(data),
//     });

//     if (!res.ok) {
//       const errorData = await res.json().catch(() => ({ message: 'Network or server error' }));
//       console.log(`Data: ${data} \n Result: ${res}`)
//       throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      
//     }

//     return res.json();
//   },

//   get: async <T = unknown>(endpoint: string, token?: string, guestId?: string): Promise<ApiResponse<T>> => {
//     const isGuestRequest = guestId !== undefined;
//     const res = await fetch(`${API_BASE}${endpoint}`, {
//       headers: buildHeaders(token, isGuestRequest, guestId),
//     });

//     if (!res.ok) {
//       const errorData = await res.json().catch(() => ({ message: 'Network or server error' }));
//       throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
//     }

//     return res.json();
//   },

//   patch: async <T = unknown>(endpoint: string, formData: FormData, token?: string): Promise<ApiResponse<T>> => {
//     const res = await fetch(`${API_BASE}${endpoint}`, {
//       method: 'PATCH',
//       headers: {
//         Authorization: `Bearer ${token}`, // Token passed in
//       },
//       body: formData,
//     });

//     if (!res.ok) {
//       const errorData = await res.json().catch(() => ({ message: 'Network or server error' }));
//       throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
//     }

//     return res.json();
//   },
// };



