import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { produceWithPatches, applyPatches, Patch, enablePatches, enableMapSet } from 'immer';

enablePatches();
enableMapSet();

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
  setSelection: (selection: {
    start: { row: number; col: number };
    end: { row: number; col: number };
  }) => void;
}

interface EditingSlice {
  editingCell: { row: number; col: number } | null;
  setEditingCell: (rc: { row: number; col: number } | null) => void;
  setCellValue: (rc: { row: number; col: number; value: string }) => void;
}

interface DimensionSlice {
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  setColWidth: (idx: number, px: number) => void;
  setRowHeight: (idx: number, px: number) => void;
}

interface HistoryEntry {
  patches: Patch[];
  inverse: Patch[];
}

interface UndoSlice {
  history: HistoryEntry[];
  future: HistoryEntry[];
  undo: () => void;
  redo: () => void;
}

interface CalcSlice {
  formulas: Record<string, string>;
  dirty: Set<string>;
  markDirty: (id: string) => void;
  clearDirty: () => void;
}

interface CycleSlice {
  cycles: Set<string>; // Track cells in cycles
  setCycles: (ids: string[]) => void; // Action to update cycles
}

export type RootState = WorkbookSlice &
  UiSlice &
  GridSlice &
  SelectionSlice &
  EditingSlice &
  DimensionSlice &
  UndoSlice &
  CalcSlice &
  CycleSlice;

export const initialState: Omit<
  RootState,
  | 'setSelection'
  | 'setEditingCell'
  | 'setCellValue'
  | 'setColWidth'
  | 'setRowHeight'
  | 'undo'
  | 'redo'
  | 'markDirty'
  | 'clearDirty'
  | 'setCycles'
> = {
  workbooks: {},
  theme: 'light',
  rows: [],
  selection: { start: null, end: null },
  editingCell: null,
  colWidths: {},
  rowHeights: {},
  history: [],
  future: [],
  formulas: {},
  dirty: new Set(),
  cycles: new Set<string>(), // Initialize cycles in state
};

const withHistory =
  (set: any, get: any) =>
  <T extends (params: any) => void>(
    fn: (draft: any, params: any) => void
  ): T => {
    return ((params: any) => {
      set((state: RootState) => {
        const [next, patches, inverse] = produceWithPatches(
          state,
          (draft: any) => {
            fn(draft, params);
          }
        );
        if (patches.length) {
          state.history.push({ patches, inverse });
          if (state.history.length > 100) state.history.shift();
          state.future = [];
          Object.assign(state, next);
        }
      });
    }) as T;
  };

const rootInitializer = (set: any, get: any) => {
  const withHistoryWrapper = withHistory(set, get);

  return {
    ...initialState,
    setRows: (rows: { id: number; cells: string[] }[]) => set({ rows }),
    setSelection: (selection: {
      start: { row: number; col: number };
      end: { row: number; col: number };
    }) => set({ selection }),
    setEditingCell: (rc: { row: number; col: number } | null) =>
      set({ editingCell: rc }),
    setCellValue: withHistoryWrapper(
      (
        draft: any,
        { row, col, value }: { row: number; col: number; value: string }
      ) => {
        const cellId = `R${row}C${col}`;
        if (value.startsWith('=')) {
          draft.formulas[cellId] = value;
          draft.dirty.add(cellId);
        } else {
          draft.rows[row].cells[col] = value;
          if (draft.formulas[cellId]) {
            delete draft.formulas[cellId];
          }
          draft.dirty.add(cellId);
        }
        console.log('Set:', { cellId, value, formulas: draft.formulas, dirty: draft.dirty });
      }
    ),
    setColWidth: (idx: number, px: number) =>
      set((state: RootState) => {
        state.colWidths[idx] = px;
      }),
    setRowHeight: (idx: number, px: number) =>
      set((state: RootState) => {
        state.rowHeights[idx] = px;
      }),
    undo: () => {
      const { history, future } = get();
      if (!history.length) return;
      const last = history[history.length - 1];
      set((state: RootState) => {
        state.history.pop();
        state.future.push(last);
        applyPatches(state, last.inverse);
      });
    },
    redo: () => {
      const { future } = get();
      if (!future.length) return;
      const next = future[future.length - 1];
      set((state: RootState) => {
        state.future.pop();
        state.history.push(next);
        applyPatches(state, next.patches);
      });
    },
    markDirty: (id: string) => set((state: RootState) => void state.dirty.add(id)),
    clearDirty: () => set((state: RootState) => void state.dirty.clear()),
    setCycles: (ids: string[]) => set({ cycles: new Set(ids) }), // Action to update cycles
  };
};

const enhancer =
  process.env.NODE_ENV === 'development'
    ? (config: any) => devtools(immer(config))
    : immer;

export const createRootStore = () => createStore(enhancer(rootInitializer));