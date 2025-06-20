import { getCalcWorker } from "./calcWorkerClient";
import { StoreApi } from "zustand";
import { RootState } from "@/store/excelStore";

// Utility function to convert row and column indices to A1 notation
function rowColToA1(row: number, col: number): string {
  let columnLetters = "";
  let tempCol = col + 1; // Excel columns start at 1 (A=1)
  while (tempCol > 0) {
    tempCol--;
    columnLetters = String.fromCharCode(65 + (tempCol % 26)) + columnLetters;
    tempCol = Math.floor(tempCol / 26);
  }
  const rowNumber = row + 1; // Excel rows start at 1
  return `${columnLetters}${rowNumber}`;
}

export async function scheduleRecalc(store: StoreApi<RootState>) {
  const state = store.getState();
  const worker = await getCalcWorker();
  const sorted = await worker.getRecalcOrder([...state.dirty]);
  if (!sorted.length) return;

  const depsMap = await worker.getDependencies(sorted);
  const items = sorted
    .filter((id) => state.formulas[id]) // Only include cells with formulas
    .map((id) => {
      const formula = state.formulas[id];
      const deps = depsMap[id] || [];
      const scope: Record<string, any> = {};
      deps.forEach((dep) => {
        const [row, col] = dep.replace("R", "").split("C").map(Number);
        const a1 = rowColToA1(row, col);
        const value = state.rows[row]?.cells[col] || "";
        scope[a1] = value;
      });
      return { id, formula, scope };
    });

  const resultPatch = await worker.batch(items);
  store.setState((s) => {
    Object.entries(resultPatch).forEach(([id, value]) => {
      const [row, col] = id.replace("R", "").split("C").map(Number);
      s.rows[row].cells[col] = String(value);
    });
    s.dirty.clear();
  });
}