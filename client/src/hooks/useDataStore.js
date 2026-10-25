import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { createApiStore, createLocalStore } from '../lib/dataStore.js';

export function useDataStore() {
  const { isGuest } = useAuth();
  return useMemo(() => (isGuest ? createLocalStore() : createApiStore()), [isGuest]);
}
