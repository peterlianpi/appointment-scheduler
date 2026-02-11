"use client";

import { useState, useCallback } from "react";
import { login } from "../lib/auth-api";
import type { LoginCredentials } from "../types/auth";

interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loginFn = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await login(credentials);

        if (result.error) {
          setError(result.error);
          return false;
        }

        return true;
      } catch {
        setError("An unexpected error occurred");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    login: loginFn,
    isLoading,
    error,
    clearError,
  };
}
