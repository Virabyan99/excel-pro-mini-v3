"use client";
import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';
import { StoreApi } from 'zustand';
import { RootState, createRootStore, initialState } from '@/store/excelStore';
import { DemoDataLoader } from './DemoDataLoader';

// React Context
const StoreContext = createContext<StoreApi<RootState> | null>(null);

// StoreProvider Component
export function StoreProvider({ children }: { children: ReactNode }) {
  const store = createRootStore();
  return (
    <StoreContext.Provider value={store}>
      <DemoDataLoader />
      {children}
    </StoreContext.Provider>
  );
}

// Hook for selecting state
export function useStore<T>(selector: (state: RootState) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreProvider missing above in React tree');
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(initialState)
  );
}

// Hook for accessing the store object
export function useStoreObject(): StoreApi<RootState> {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreProvider missing above in React tree');
  return store;
}

// Hook for accessing actions
export function useStoreActions() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreProvider missing above in React tree');
  return {
    setRows: store.getState().setRows,
    setSelection: store.getState().setSelection,
    setEditingCell: store.getState().setEditingCell,
    setCellValue: store.getState().setCellValue,
    setColWidth: store.getState().setColWidth,
    setRowHeight: store.getState().setRowHeight,
    undo: store.getState().undo,
    redo: store.getState().redo,
  };
}