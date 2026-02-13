/**
 * API Response Utilities
 *
 * Shared utilities for handling API responses and error parsing
 * across the application.
 */

// ============================================
// Types
// ============================================

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error?: {
    message?: string;
    code?: string;
  };
  message?: string;
}

/**
 * Options for parsing API responses
 */
export interface ParseApiResponseOptions {
  /** Default error message if no specific message is found */
  defaultErrorMessage?: string;
}

/**
 * Result type for parsed API responses
 */
export type ApiResponse<T> = T;

// ============================================
// Error Handler
// ============================================

/**
 * Parses an API Response object and extracts error information
 *
 * @param response - The Response object from fetch
 * @param options - Configuration options
 * @returns The parsed JSON data as type T
 * @throws Error with extracted message if response is not ok
 *
 * @example
 * ```typescript
 * const res = await fetch('/api/data');
 * const data = await parseApiResponse<DataType>(res, {
 *   defaultErrorMessage: 'Failed to fetch data'
 * });
 * ```
 */
export async function parseApiResponse<T>(
  response: Response,
  options: ParseApiResponseOptions = {},
): Promise<T> {
  const { defaultErrorMessage = "An error occurred" } = options;

  if (!response.ok) {
    let errorMessage = defaultErrorMessage;

    try {
      const error = (await response.json()) as ApiErrorResponse;

      // Try to extract message from various error formats
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } catch {
      // If JSON parsing fails, use default message
      // Response might be empty or non-JSON
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as T;
  return data;
}

/**
 * Helper to create a response parser with default options
 *
 * @param defaultErrorMessage - Default error message for this parser
 * @returns Configured parseApiResponse function
 *
 * @example
 * ```typescript
 * const parseAppointmentResponse = createResponseParser('Failed to fetch appointments');
 * const data = await parseAppointmentResponse<AppointmentListResponse>(res);
 * ```
 */
export function createResponseParser(defaultErrorMessage: string) {
  return <T>(response: Response): Promise<T> =>
    parseApiResponse<T>(response, { defaultErrorMessage });
}
