"use client";
import { useStore, useStoreActions } from '@/components/StoreProvider';
import { useCallback, useEffect } from 'react';

export function useGridKeyboard(rowCount: number, colCount: number) {
  const active = useStore((s) => s.activeCell);
  const { setActiveCell } = useStoreActions();

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!active) return;
      let { row, col } = active;
      switch (e.key) {
        case 'ArrowDown':
          row = row < rowCount - 1 ? row + 1 : 0;
          break;
        case 'ArrowUp':
          row = row > 0 ? row - 1 : rowCount - 1;
          break;
        case 'ArrowRight':
          col = col < colCount - 1 ? col + 1 : 0;
          break;
        case 'ArrowLeft':
          col = col > 0 ? col - 1 : colCount - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      setActiveCell({ row, col });
    },
    [active, rowCount, colCount, setActiveCell]
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}