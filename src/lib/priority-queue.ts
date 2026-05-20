export class PriorityQueue<T> {
  private heap: { item: T; priority: number; seq: number }[] = [];
  private counter = 0;

  enqueue(item: T, priority: number): void {
    this.heap.push({ item, priority, seq: this.counter++ });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top.item;
  }

  peek(): T | null {
    return this.heap.length > 0 ? this.heap[0].item : null;
  }

  get size(): number {
    return this.heap.length;
  }

  toSortedArray(): T[] {
    return [...this.heap]
      .sort((a, b) => a.priority - b.priority || a.seq - b.seq)
      .map((entry) => entry.item);
  }

  private cmp(a: { priority: number; seq: number }, b: { priority: number; seq: number }): number {
    return a.priority - b.priority || a.seq - b.seq;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.cmp(this.heap[parent], this.heap[index]) <= 0) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < length && this.cmp(this.heap[left], this.heap[smallest]) < 0) smallest = left;
      if (right < length && this.cmp(this.heap[right], this.heap[smallest]) < 0) smallest = right;
      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}