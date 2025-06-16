"use client";
import { useEffect } from 'react';
import { useStoreActions } from './StoreProvider';

export function DemoDataLoader() {
  const { setRows } = useStoreActions();

  useEffect(() => {
    const demo = Array.from({ length: 10_000 }, (_, r) => ({
      id: r,
      cells: Array.from({ length: 10 }, (_, c) => `R${r + 1}C${c + 1}`),
    }));
    setRows(demo);
  }, [setRows]);

  return null;
}