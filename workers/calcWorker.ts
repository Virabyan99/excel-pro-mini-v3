// workers/calcWorker.ts
import * as Comlink from 'comlink';
import { SUM } from '@formulajs/formulajs'; // Named import for tree-shaking

const api = {
  ping: () => 'pong',
  add: (a: number, b: number) => a + b, // Existing function preserved
  sum: (...numbers: number[]) => SUM(numbers), // New function using Formulajs SUM
};

export type CalcWorkerApi = typeof api;

Comlink.expose(api);