import * as Comlink from "comlink";
import { create, all } from "mathjs";
import { DepGraph } from "@/engine/depGraph";

type ExcelValue = number | string | boolean | Date | Error;

function toExcelError(msg: string): Error {
  return new Error(`#${msg}!`);
}

function coerce(value: any): ExcelValue {
  if (value instanceof Date || value instanceof Error) return value;
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || Number.isNaN(value))
    return toExcelError("VALUE");
  return value;
}

const math = create(all);
math.import(
  {
    SUM: (...args: number[]) => args.reduce((acc, val) => acc + val, 0),
    AVERAGE: (...args: number[]) =>
      args.reduce((acc, val) => acc + val, 0) / args.length,
    MIN: (...args: number[]) => Math.min(...args),
    MAX: (...args: number[]) => Math.max(...args),
    CONCATENATE: (...args: string[]) => args.join(""),
    IF: (condition: boolean, trueVal: any, falseVal: any) =>
      condition ? trueVal : falseVal,
    AND: (...args: boolean[]) => args.every(Boolean),
    OR: (...args: boolean[]) => args.some(Boolean),
    COUNT: (...args: any[]) => args.filter((arg) => typeof arg === "number").length,
  },
  { override: true }
);

async function evaluateFormula(formula: string, scope: Record<string, any>): Promise<ExcelValue> {
  try {
    const expr = formula.startsWith("=") ? formula.slice(1) : formula;
    const result = math.evaluate(expr, scope);
    return coerce(result);
  } catch (error) {
    if (error.message.includes("Undefined symbol")) {
      return toExcelError("REF"); // e.g., #REF! for missing references
    }
    return toExcelError("ERROR"); // Generic error
  }
}

const depGraph = new DepGraph();
const cellFormulas = new Map<string, string>();

function getDescendants(cell: string): string[] {
  const visited = new Set<string>();
  const queue = [cell];
  while (queue.length) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    const neighbors = depGraph.adj.get(node) || new Set();
    queue.push(...neighbors);
  }
  return Array.from(visited);
}

const api = {
  ping: () => "pong",
  add: (a: number, b: number) => a + b,
  eval: async (formula: string, scope: Record<string, any>) => await evaluateFormula(formula, scope),
  registerEdges: (cell: string, deps: string[]) => {
    deps.forEach((d) => depGraph.addEdge(d, cell));
  },
  removeEdges: (cell: string, deps: string[]) => {
    deps.forEach((d) => depGraph.removeEdge(d, cell));
  },
  getRecalcOrder: (ids: string[]) => {
    try {
      const topo = depGraph.getTopoSorted();
      const affected = new Set<string>();
      ids.forEach((id) => {
        getDescendants(id).forEach((desc) => affected.add(desc));
      });
      return topo.filter((id) => affected.has(id));
    } catch (e) {
      if ((e as Error).message === "CYCLE") return [];
      throw e;
    }
  },
  setFormula: (cell: string, formula: string, deps: string[]) => {
    depGraph.adj.forEach((tos, from) => {
      if (tos.has(cell)) depGraph.removeEdge(from, cell);
    });
    depGraph.addNode(cell);
    cellFormulas.set(cell, formula);
    deps.forEach((dep) => depGraph.addEdge(dep, cell));
    console.log(`Worker set: ${cell} = ${formula}`);
  },
  removeFormula: (cell: string) => {
    if (cellFormulas.has(cell)) {
      depGraph.removeNode(cell);
      cellFormulas.delete(cell);
    }
  },
  getDescendants: (cell: string) => getDescendants(cell),
  getDependencies: (ids: string[]) => {
    const result: Record<string, string[]> = {};
    ids.forEach((id) => {
      const deps: string[] = [];
      depGraph.adj.forEach((tos, from) => {
        if (tos.has(id)) deps.push(from);
      });
      result[id] = deps;
    });
    return result;
  },
  batch: async (items: { id: string; formula: string; scope: Record<string, any> }[]) => {
    const results: Record<string, ExcelValue> = {};
    for (const item of items) {
      results[item.id] = await evaluateFormula(item.formula, item.scope);
    }
    return results;
  },
};

export type CalcWorkerApi = typeof api;

Comlink.expose(api);