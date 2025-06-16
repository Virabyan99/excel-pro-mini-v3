import { createStore } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Define Slices
interface WorkbookSlice {
  workbooks: Record<string, unknown>;
}

interface UiSlice {
  theme: 'light' | 'dark';
}

interface GridSlice {
  rows: { id: number; cells: string[] }[];
}

export type RootState = WorkbookSlice & UiSlice & GridSlice;

// Initial state for SSR
export const initialState: RootState = {
  workbooks: {},
  theme: 'light',
  rows: [],
};

// Root State Initializer
const rootInitializer = (set: any, get: any) => ({
  ...initialState,
  setRows: (rows: { id: number; cells: string[] }[]) => set({ rows }),
});

// Create Store with DevTools and Immer
const enhancer =
  process.env.NODE_ENV === 'development'
    ? (config: any) => devtools(immer(config))
    : immer;

export const createRootStore = () => createStore(enhancer(rootInitializer));