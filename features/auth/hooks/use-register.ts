"use client";

import { useState, useCallback } from "react";
import { register } from "../lib/auth-api";
import type { RegisterData } from "../types/auth";

interface UseRegisterReturn {
  register: (data: RegisterData) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useRegister(): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const registerFn = useCallback(
    async (data: RegisterData): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await register(data);

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
    []
  );

  return {
    register: registerFn,
    isLoading,
    error,
    clearError,
  };
}
