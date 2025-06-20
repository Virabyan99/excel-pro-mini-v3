export class DepGraph {
  private adj = new Map<string, Set<string>>();
  private nodes = new Set<string>();
  private topo: string[] = [];
  private dirty = true;
  private cycleSet = new Set<string>(); // Tracks cells in cycles
  private cycles: string[][] = []; // Stores detected cycles

  addNode(cell: string) {
    if (!this.nodes.has(cell)) {
      this.nodes.add(cell);
      this.dirty = true;
    }
  }

  addEdge(from: string, to: string) {
    this.addNode(from);
    this.addNode(to);
    if (!this.adj.has(from)) this.adj.set(from, new Set());
    this.adj.get(from)!.add(to);
    this.dirty = true;
    this.updateCycles(); // Update cycles whenever graph changes
  }

  removeEdge(from: string, to: string) {
    this.adj.get(from)?.delete(to);
    this.dirty = true;
    this.updateCycles(); // Update cycles whenever graph changes
  }

  removeNode(cell: string) {
    this.adj.delete(cell);
    this.adj.forEach((tos) => tos.delete(cell));
    this.nodes.delete(cell);
    this.dirty = true;
    this.updateCycles(); // Update cycles whenever graph changes
  }

  private detectCycles(): string[][] {
    const indexMap = new Map<string, number>();
    const lowMap = new Map<string, number>();
    const stack: string[] = [];
    const onStack = new Set<string>();
    let index = 0;
    const cycles: string[][] = [];

    const dfs = (v: string) => {
      indexMap.set(v, index);
      lowMap.set(v, index);
      index++;
      stack.push(v);
      onStack.add(v);

      this.adj.get(v)?.forEach((w) => {
        if (!indexMap.has(w)) {
          dfs(w);
          lowMap.set(v, Math.min(lowMap.get(v)!, lowMap.get(w)!));
        } else if (onStack.has(w)) {
          lowMap.set(v, Math.min(lowMap.get(v)!, indexMap.get(w)!));
        }
      });

      if (lowMap.get(v) === indexMap.get(v)) {
        const scc: string[] = [];
        let w: string | undefined;
        do {
          w = stack.pop();
          if (!w) break;
          onStack.delete(w);
          scc.push(w);
        } while (w !== v);
        // A cycle exists if SCC has more than one node or a self-loop
        if (scc.length > 1 || (scc.length === 1 && this.adj.get(v)?.has(v))) {
          cycles.push(scc);
        }
      }
    };

    this.nodes.forEach((v) => {
      if (!indexMap.has(v)) dfs(v);
    });

    return cycles;
  }

  private updateCycles() {
    this.cycles = this.detectCycles();
    this.cycleSet.clear();
    this.cycles.forEach((cycle) => {
      cycle.forEach((cell) => this.cycleSet.add(cell));
    });
  }

  isInCycle(cell: string): boolean {
    return this.cycleSet.has(cell);
  }

  getCycles(): string[][] {
    return this.cycles;
  }

  private computeTopo() {
    const indeg = new Map<string, number>();
    this.nodes.forEach((v) => {
      indeg.set(v, 0);
    });
    this.adj.forEach((out, v) => {
      out.forEach((w) => {
        indeg.set(w, (indeg.get(w) || 0) + 1);
      });
    });

    const q: string[] = [...indeg.entries()]
      .filter(([, d]) => d === 0)
      .map(([v]) => v);
    const order: string[] = [];

    while (q.length) {
      const v = q.shift()!;
      order.push(v);
      this.adj.get(v)?.forEach((w) => {
        indeg.set(w, indeg.get(w)! - 1);
        if (indeg.get(w) === 0) q.push(w);
      });
    }

    if (order.length !== this.nodes.size) {
      throw new Error('CYCLE');
    }

    this.topo = order;
    this.dirty = false;
  }

  getTopoSorted(): string[] {
    if (this.dirty) this.computeTopo();
    return this.topo;
  }
}