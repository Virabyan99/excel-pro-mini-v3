"use client";
import { KeyboardEvent, useCallback } from 'react';
import { useStore, useStoreActions } from '@/components/StoreProvider';

export function useCellEditor() {
  const editingCell = useStore((s) => s.editingCell);
  const { setEditingCell, setCellValue } = useStoreActions();

  const startEdit = useCallback(
    (row: number, col: number) => setEditingCell({ row, col }),
    [setEditingCell]
  );

  const commitEdit = useCallback(
    (row: number, col: number, value: string) => {
      setCellValue({ row, col, value });
      setEditingCell(null);
    },
    [setCellValue, setEditingCell]
  );

  const cancelEdit = useCallback(() => setEditingCell(null), [setEditingCell]);

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      if (e.key === 'Enter') {
        commitEdit(row, col, (e.target as HTMLInputElement).value);
      }
      if (e.key === 'Escape') {
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit]
  );

  return { editingCell, startEdit, commitEdit, cancelEdit, handleKey };
}