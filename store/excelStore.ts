import { createStore, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// Define Slices
interface WorkbookSlice {
  workbooks: Record<string, unknown>;
}

interface UiSlice {
  theme: 'light' | 'dark';
}

export type RootState = WorkbookSlice & UiSlice;

// Root State Initializer
const rootInitializer = immer<RootState>(() => ({
  workbooks: {},
  theme: 'light',
}));

// Create Store with DevTools
const enhancer =
  process.env.NODE_ENV === 'development'
    ? devtools
    : <S extends object>(f: (set: any) => S) => f;

export const createRootStore = () => createStore(enhancer(immer(rootInitializer)));