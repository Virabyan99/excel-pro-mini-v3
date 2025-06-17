import { createStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { produceWithPatches, applyPatches, Patch, enablePatches } from 'immer';

enablePatches();

// Define Slices (unchanged)
interface WorkbookSlice {
  workbooks: Record<string, unknown>
}

interface UiSlice {
  theme: 'light' | 'dark'
}

interface GridSlice {
  rows: { id: number; cells: string[] }[]
}

interface SelectionSlice {
  selection: {
    start: { row: number; col: number } | null
    end: { row: number; col: number } | null
  }
  setSelection: (selection: {
    start: { row: number; col: number }
    end: { row: number; col: number }
  }) => void
}

interface EditingSlice {
  editingCell: { row: number; col: number } | null
  setEditingCell: (rc: { row: number; col: number } | null) => void
  setCellValue: (rc: { row: number; col: number; value: string }) => void
}

interface DimensionSlice {
  colWidths: Record<number, number>
  rowHeights: Record<number, number>
  setColWidth: (idx: number, px: number) => void
  setRowHeight: (idx: number, px: number) => void
}

interface HistoryEntry {
  patches: Patch[]
  inverse: Patch[]
}

interface UndoSlice {
  history: HistoryEntry[]
  future: HistoryEntry[]
  undo: () => void
  redo: () => void
}

// Combine all slices into RootState (removed 'withHistory' from UndoSlice)
export type RootState = WorkbookSlice &
  UiSlice &
  GridSlice &
  SelectionSlice &
  EditingSlice &
  DimensionSlice &
  UndoSlice

// Initial state for SSR (removed 'withHistory' from omission)
export const initialState: Omit<
  RootState,
  | 'setSelection'
  | 'setEditingCell'
  | 'setCellValue'
  | 'setColWidth'
  | 'setRowHeight'
  | 'undo'
  | 'redo'
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
}

// Define withHistory to pass draft explicitly
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
            fn(draft, params)
          }
        )
        if (patches.length) {
          state.history.push({ patches, inverse })
          if (state.history.length > 100) state.history.shift()
          state.future = []
          Object.assign(state, next)
        }
      })
    }) as T
  }

// Root State Initializer
const rootInitializer = (set: any, get: any) => {
  const withHistoryWrapper = withHistory(set, get)

  return {
    ...initialState,
    setRows: (rows: { id: number; cells: string[] }[]) => set({ rows }),
    setSelection: (selection: {
      start: { row: number; col: number }
      end: { row: number; col: number }
    }) => set({ selection }),
    setEditingCell: (rc: { row: number; col: number } | null) =>
      set({ editingCell: rc }),
    setCellValue: withHistoryWrapper(
      (
        draft: any,
        { row, col, value }: { row: number; col: number; value: string }
      ) => {
        draft.rows[row].cells[col] = value
      }
    ),
    setColWidth: (idx: number, px: number) =>
      set((state: RootState) => {
        state.colWidths[idx] = px
      }),
    setRowHeight: (idx: number, px: number) =>
      set((state: RootState) => {
        state.rowHeights[idx] = px
      }),
    undo: () => {
      const { history, future } = get()
      if (!history.length) return
      const last = history[history.length - 1]
      set((state: RootState) => {
        state.history.pop()
        state.future.push(last)
        applyPatches(state, last.inverse)
      })
    },
    redo: () => {
      const { future } = get()
      if (!future.length) return
      const next = future[future.length - 1]
      set((state: RootState) => {
        state.future.pop()
        state.history.push(next)
        applyPatches(state, next.patches)
      })
    },
  }
}

// Create Store with DevTools and Immer
const enhancer =
  process.env.NODE_ENV === 'development'
    ? (config: any) => devtools(immer(config))
    : immer

export const createRootStore = () => createStore(enhancer(rootInitializer))
