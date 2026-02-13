"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Debounced search hook that delays execution until user stops typing
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns [debouncedValue, setValue, cancel] tuple
 */
export function useDebouncedSearch(delay: number = 300) {
  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  const cancel = useCallback(() => {
    setValue("");
    setDebouncedValue("");
  }, []);

  return [debouncedValue, setValue, cancel, value] as const;
}

/**
 * Debounced value hook for simple value debouncing
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
