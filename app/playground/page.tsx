'use client';

import { useEffect, useState } from 'react';
import { getCalcWorker } from '@/lib/calcWorkerClient';

export default function Playground() {
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const worker = await getCalcWorker();
      await worker.registerEdges('R1C0', ['R0C0']); // A2 depends on A1
      const order = await worker.getRecalcOrder(['R0C0']);
      setResult(`Recalc order: ${order.join(', ')}`);
    })();
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-xl font-bold">Calc Worker Playground</h1>
      <p>{result ?? 'Loading...'}</p>
    </main>
  );
}