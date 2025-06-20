export class DepGraph {
  private adj = new Map<string, Set<string>>();
  private nodes = new Set<string>(); // Track all cells with formulas
  private topo: string[] = [];
  private dirty = true;

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
  }

  removeEdge(from: string, to: string) {
    this.adj.get(from)?.delete(to);
    this.dirty = true;
  }

  removeNode(cell: string) {
    this.adj.delete(cell);
    this.adj.forEach((tos) => tos.delete(cell));
    this.nodes.delete(cell);
    this.dirty = true;
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