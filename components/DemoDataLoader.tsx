"use client";
import { useEffect } from 'react';
import { useStoreActions } from './StoreProvider';

export function DemoDataLoader() {
  const { setRows } = useStoreActions();

  useEffect(() => {
    const numRows = 100;
    const numCols = 50;
    const demo = Array.from({ length: numRows }, (_, r) => ({
      id: r,
      cells: Array.from({ length: numCols }, (_, c) => `R${r + 1}C${c + 1}`),
    }));
    setRows(demo);
  }, [setRows]);

  return null;
}