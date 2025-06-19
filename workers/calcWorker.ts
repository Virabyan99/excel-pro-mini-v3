import * as Comlink from 'comlink';
import { create, all, MathNode } from 'mathjs';
import { DepGraph } from '@/engine/depGraph'; // Adjust path

type ExcelValue = number | string | boolean | Date | Error;

function toExcelError(msg: string): Error {
  return new Error(`#${msg}!`);
}

function coerce(value: any): ExcelValue {
  if (value instanceof Date || value instanceof Error) return value;
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined || Number.isNaN(value))
    return toExcelError('VALUE');
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
    CONCATENATE: (...args: string[]) => args.join(''),
    IF: (condition: boolean, trueVal: any, falseVal: any) =>
      condition ? trueVal : falseVal,
    AND: (...args: boolean[]) => args.every(Boolean),
    OR: (...args: boolean[]) => args.some(Boolean),
  },
  { override: true }
);

function evaluateNode(node: MathNode): ExcelValue {
  switch (node.type) {
    case 'ConstantNode':
      return node.value;
    case 'SymbolNode':
      return toExcelError('REF');
    case 'OperatorNode': {
      const left = evaluateNode(node.args[0]);
      const right = evaluateNode(node.args[1]);
      if (left instanceof Error || right instanceof Error) return left;
      switch (node.op) {
        case '+':
          return (left as number) + (right as number);
        case '-':
          return (left as number) - (right as number);
        case '*':
          return (left as number) * (right as number);
        case '/':
          return (right as number) === 0
            ? toExcelError('DIV/0')
            : (left as number) / (right as number);
        default:
          return toExcelError('NA');
      }
    }
    case 'FunctionNode': {
      const name = node.name.toUpperCase();
      const impl = math[name];
      if (!impl) return toExcelError('NAME');
      const args = node.args.map(evaluateNode);
      if (args.some((a) => a instanceof Error))
        return args.find((a) => a instanceof Error) as Error;
      return coerce(impl(...args));
    }
    default:
      return toExcelError('NA');
  }
}

async function evaluateFormula(formula: string): Promise<ExcelValue> {
  try {
    const expr = formula.startsWith('=') ? formula.slice(1) : formula;
    const node = math.parse(expr);
    return evaluateNode(node);
  } catch (error) {
    return toExcelError('ERROR');
  }
}

const depGraph = new DepGraph();

const api = {
  ping: () => 'pong',
  add: (a: number, b: number) => a + b,
  eval: async (formula: string) => await evaluateFormula(formula),
  registerEdges: (cell: string, deps: string[]) => {
    deps.forEach((d) => depGraph.addEdge(d, cell));
  },
  removeEdges: (cell: string, deps: string[]) => {
    deps.forEach((d) => depGraph.removeEdge(d, cell));
  },
  getRecalcOrder: () => {
    try {
      return depGraph.getTopoSorted();
    } catch (e) {
      if ((e as Error).message === 'CYCLE') {
        return []; // Placeholder; handle in Lesson 3.6
      }
      throw e;
    }
  },
};

export type CalcWorkerApi = typeof api;

Comlink.expose(api);