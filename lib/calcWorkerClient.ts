import * as Comlink from 'comlink';
import type { CalcWorkerApi } from '@/workers/calcWorker';

let instance: Comlink.Remote<CalcWorkerApi> | null = null;

export async function getCalcWorker() {
  if (instance) return instance;

  const worker = new Worker(new URL('@/workers/calcWorker.ts', import.meta.url), { type: 'module' });
  instance = Comlink.wrap<CalcWorkerApi>(worker);
  return instance;
}