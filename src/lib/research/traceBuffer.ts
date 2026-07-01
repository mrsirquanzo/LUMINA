export function createTraceBuffer<T>(opts: {
  onFlush: (batch: T[]) => void;
  schedule: (cb: () => void) => () => void; // schedule a flush; returns a cancel handle
}): { push(e: T): void; flush(): void; dispose(): void } {
  let buffer: T[] = [];
  let cancelHandle: (() => void) | null = null;
  let isScheduled = false;

  function flush() {
    if (buffer.length > 0) {
      const batch = buffer;
      buffer = [];
      opts.onFlush(batch);
    }
    isScheduled = false;
  }

  return {
    push(e: T) {
      buffer.push(e);
      if (!isScheduled) {
        cancelHandle = opts.schedule(flush);
        isScheduled = true;
      }
    },
    flush() {
      flush();
    },
    dispose() {
      if (cancelHandle) {
        cancelHandle();
        cancelHandle = null;
      }
      buffer = [];
      isScheduled = false;
    },
  };
}
