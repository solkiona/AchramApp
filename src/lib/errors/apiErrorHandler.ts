// hooks/useApiErrorHandler.ts (or utils/apiErrorHandler.ts)

import { useState } from 'react';

type FieldErrors = {
  [fieldName: string]: string[];
};

export const useApiErrorHandler = () => {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const parseFieldErrors = (details: any): FieldErrors => {
    const parsedFieldErrors: FieldErrors = {};
    if (details && typeof details === 'object') {
      for (const fieldName in details) {
        if (details.hasOwnProperty(fieldName)) {
          const fieldErrorList = details[fieldName];
          if (Array.isArray(fieldErrorList) && fieldErrorList.length > 0) {
            parsedFieldErrors[fieldName] = fieldErrorList;
          } else if (typeof fieldErrorList === 'string') {
            parsedFieldErrors[fieldName] = [fieldErrorList];
          }
        }
      }
    }
    return parsedFieldErrors;
  };

  const handleApiError = (errorObj: any) => {
    console.log("Handling API error object:", errorObj); // Debug log

    // Check if it looks like an API response error (has status === "error")
    if (errorObj && typeof errorObj === 'object' && errorObj.status === "error") {
      const response = errorObj;

      // Parse field-specific errors
      const parsedFieldErrors = parseFieldErrors(response.details);
      setFieldErrors(parsedFieldErrors);

      // Set a general error message (e.g., the first field error or the top-level message)
      let message = response.message || 'Operation failed.';
      if (Object.keys(parsedFieldErrors).length > 0) {
        const firstField = Object.keys(parsedFieldErrors)[0];
        message = parsedFieldErrors[firstField][0] || message; // Use first error of first field
      }
      setGeneralError(message);
    }
    // Check if it looks like a raw error object from a catch block (e.g., err.response.data)
    else if (errorObj && typeof errorObj === 'object' && errorObj.status === "error") {
      // This branch handles the case where the entire error object *is* the API error response
      // e.g., handleApiError(err.response.data) in a catch block
      const response = errorObj;
      const parsedFieldErrors = parseFieldErrors(response.details);
      setFieldErrors(parsedFieldErrors);

      let message = response.message || 'An error occurred.';
      if (Object.keys(parsedFieldErrors).length > 0) {
        const firstField = Object.keys(parsedFieldErrors)[0];
        message = parsedFieldErrors[firstField][0] || message;
      }
      setGeneralError(message);
    }
    // Handle raw error object (e.g., from catch) that might have response.data
    else if (errorObj && errorObj.response && errorObj.response.data) {
        const responseData = errorObj.response.data;
        if (responseData.status === "error") {
            const parsedFieldErrors = parseFieldErrors(responseData.details);
            setFieldErrors(parsedFieldErrors);

            let message = responseData.message || 'An error occurred.';
            if (Object.keys(parsedFieldErrors).length > 0) {
                const firstField = Object.keys(parsedFieldErrors)[0];
                message = parsedFieldErrors[firstField][0] || message;
            }
            setGeneralError(message);
        } else {
            // If response data doesn't have status "error", treat it as a generic error
            setGeneralError(errorObj.response.data.message || 'An unexpected error occurred.');
            setFieldErrors({}); // Clear field errors
        }
    }
    // Handle other raw error objects (e.g., network errors, non-API errors)
    else {
        setGeneralError(errorObj?.message || 'An unexpected error occurred.');
        setFieldErrors({}); // Clear field errors
    }
  };

  const clearErrors = () => {
    setGeneralError(null);
    setFieldErrors({});
  };

  return { generalError, fieldErrors, handleApiError, clearErrors };
};