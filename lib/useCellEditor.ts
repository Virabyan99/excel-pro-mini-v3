"use client";
import { KeyboardEvent, useCallback } from "react";
import { useStore, useStoreActions, useStoreObject } from "@/components/StoreProvider";
import { getCalcWorker } from "@/lib/calcWorkerClient";
import { parse, MathNode } from "mathjs";
import { scheduleRecalc } from "@/lib/calcScheduler";

// Utility function to convert A1 notation to row and column indices
function a1ToRowCol(a1: string): { row: number; col: number } {
  const match = a1.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error("Invalid cell reference");
  const colLetters = match[1];
  const rowNumber = parseInt(match[2], 10);
  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64); // 'A' = 1, 'B' = 2, etc.
  }
  col -= 1; // Convert to 0-based (A = 0)
  const row = rowNumber - 1; // Excel rows start at 1, we use 0-based
  return { row, col };
}

export function useCellEditor() {
  const editingCell = useStore((s) => s.editingCell);
  const { setEditingCell, setCellValue } = useStoreActions();
  const store = useStoreObject();

  const getFormulaDependencies = (formula: string): string[] => {
    try {
      const expr = formula.startsWith("=") ? formula.slice(1) : formula;
      const node = parse(expr);
      const deps: string[] = [];
      const extract = (n: MathNode) => {
        if (n.type === "SymbolNode") {
          if (/^[A-Z]+\d+$/.test(n.name)) { // Check for A1 notation (e.g., A1, B2)
            try {
              const { row, col } = a1ToRowCol(n.name);
              const cellId = `R${row}C${col}`; // Convert to internal format
              deps.push(cellId);
            } catch (e) {
              // Invalid reference, skip it
            }
          }
        } else if ("args" in n) {
          n.args.forEach(extract);
        }
      };
      extract(node);
      return deps;
    } catch {
      return [];
    }
  };

  const commitEdit = useCallback(
    async (row: number, col: number, value: string) => {
      console.log("Committing:", { row, col, value });
      const cellId = `R${row}C${col}`;
      setCellValue({ row, col, value });
      const worker = await getCalcWorker();
      if (value.startsWith("=")) {
        const deps = getFormulaDependencies(value);
        await worker.setFormula(cellId, value, deps);
      } else {
        await worker.removeFormula(cellId);
        const descendants = await worker.getDescendants(cellId);
        descendants.forEach((dep) => {
          if (dep !== cellId) store.getState().markDirty(dep);
        });
      }
      setEditingCell(null);
      scheduleRecalc(store);
    },
    [setCellValue, setEditingCell, store]
  );

  const startEdit = useCallback(
    (row: number, col: number) => setEditingCell({ row, col }),
    [setEditingCell]
  );

  const cancelEdit = useCallback(() => setEditingCell(null), [setEditingCell]);

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      if (e.key === "Enter") {
        commitEdit(row, col, (e.target as HTMLInputElement).value);
      }
      if (e.key === "Escape") {
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit]
  );

  return { editingCell, startEdit, commitEdit, cancelEdit, handleKey };
}