import { useCallback } from "react";

export const useLocalStorage = () => {
  const getLocalStorageItem = useCallback(
    (key: string, defaultValue: string | null = null) => {
      try {
        const item = localStorage.getItem(key);
        return item !== null ? item : defaultValue;
      } catch (error) {
        console.error(`Error accessing localStorage for key ${key}:`, error);
        return defaultValue;
      }
    },
    []
  );

  const setLocalStorageItem = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting localStorage for key ${key}:`, error);
    }
  }, []);

  return { getLocalStorageItem, setLocalStorageItem };
};
