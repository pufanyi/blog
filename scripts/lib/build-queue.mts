/** Coalesce edits and keep one generator alive at a time, including after failures. */
export function createBuildQueue(
  run: () => Promise<void>,
  reportError: (error: unknown) => void,
  delay = 150,
): { request: () => void; close: () => Promise<void> } {
  let pending = false;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | undefined;
  async function drain(): Promise<void> {
    while (pending && !closed) {
      pending = false;
      try {
        await run();
      } catch (error) {
        reportError(error);
      }
    }
  }
  function schedule(): void {
    clearTimeout(timer);
    timer = setTimeout(() => {
      running = drain().finally(() => {
        running = undefined;
        if (pending && !closed) schedule();
      });
    }, delay);
  }
  return {
    request() {
      if (closed) return;
      pending = true;
      if (!running) schedule();
    },
    async close() {
      closed = true;
      pending = false;
      clearTimeout(timer);
      await running;
    },
  };
}
