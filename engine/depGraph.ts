export class DepGraph {
  private adj = new Map<string, Set<string>>();
  private topo: string[] = [];
  private dirty = true;

  addEdge(from: string, to: string) {
    if (!this.adj.has(from)) this.adj.set(from, new Set());
    this.adj.get(from)!.add(to);
    this.dirty = true;
  }

  removeEdge(from: string, to: string) {
    this.adj.get(from)?.delete(to);
    this.dirty = true;
  }

  private computeTopo() {
    const indeg = new Map<string, number>();
    this.adj.forEach((out, v) => {
      if (!indeg.has(v)) indeg.set(v, 0);
      out.forEach((w) => indeg.set(w, (indeg.get(w) ?? 0) + 1));
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

    if (order.length !== indeg.size) {
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