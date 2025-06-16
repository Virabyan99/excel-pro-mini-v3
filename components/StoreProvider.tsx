"use client";
import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';
import { StoreApi } from 'zustand';
import { RootState, createRootStore } from '@/store/excelStore';

// React Context
const StoreContext = createContext<StoreApi<RootState> | null>(null);

// StoreProvider Component
export function StoreProvider({ children }: { children: ReactNode }) {
  const store = createRootStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

// Primary Hook
export function useStore<T>(selector: (state: RootState) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreProvider missing above in React tree');
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState())
  );
}