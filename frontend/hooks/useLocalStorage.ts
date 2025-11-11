

// FIX: Import Dispatch and SetStateAction to provide types for the hook's return value without needing the full React namespace.
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function getValue<T,>(key: string, initialValue: T | (() => T)): T {
  const savedValue = localStorage.getItem(key);
  if (savedValue) {
    try {
        return JSON.parse(savedValue);
    } catch (error) {
        console.error("Error parsing JSON from localStorage", error);
        localStorage.removeItem(key); // Remove corrupted data
    }
  }
  
  if (initialValue instanceof Function) {
    return initialValue();
  }
  return initialValue;
}

// FIX: Use imported Dispatch and SetStateAction types to resolve "Cannot find namespace 'React'" error.
export function useLocalStorage<T,>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    return getValue(key, initialValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}