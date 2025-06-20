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
      cells: Array.from({ length: numCols }, () => ''), // Initialize cells as empty strings
    }));
    setRows(demo);
  }, [setRows]);

  return null;
}