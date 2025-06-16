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

interface SelectionSlice {
  selection: {
    start: { row: number; col: number } | null;
    end: { row: number; col: number } | null;
  };
  setSelection: (selection: { start: { row: number; col: number }; end: { row: number; col: number } }) => void;
}

interface EditingSlice {
  editingCell: { row: number; col: number } | null;
  setEditingCell: (rc: { row: number; col: number } | null) => void;
  setCellValue: (rc: { row: number; col: number; value: string }) => void;
}

// Combine all slices into RootState
export type RootState = WorkbookSlice & UiSlice & GridSlice & SelectionSlice & EditingSlice;

// Initial state for SSR
export const initialState: Omit<RootState, 'setSelection' | 'setEditingCell' | 'setCellValue'> = {
  workbooks: {},
  theme: 'light',
  rows: [],
  selection: { start: null, end: null },
  editingCell: null,
};

// Root State Initializer
const rootInitializer = (set: any, get: any) => ({
  ...initialState,
  setRows: (rows: { id: number; cells: string[] }[]) => set({ rows }),
  setSelection: (selection: { start: { row: number; col: number }; end: { row: number; col: number } }) => set({ selection }),
  setEditingCell: (rc: { row: number; col: number } | null) => set({ editingCell: rc }),
  setCellValue: ({ row, col, value }: { row: number; col: number; value: string }) =>
    set((state: RootState) => {
      state.rows[row].cells[col] = value;
    }),
});

// Create Store with DevTools and Immer
const enhancer =
  process.env.NODE_ENV === 'development'
    ? (config: any) => devtools(immer(config))
    : immer;

export const createRootStore = () => createStore(enhancer(rootInitializer));