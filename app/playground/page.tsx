// app/playground/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getCalcWorker } from '@/lib/calcWorkerClient';

export default function Playground() {
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const worker = await getCalcWorker();
      const value = await worker.sum(1, 2); // Changed from add to sum
      setResult(value);
    })();
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-xl font-bold">Calc Worker Playground</h1>
      <p>SUM(1, 2) = {result ?? 'calculating…'}</p> {/* Updated display text */}
    </main>
  );
}