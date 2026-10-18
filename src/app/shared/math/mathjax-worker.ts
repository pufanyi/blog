export interface MathWorkerOptions {
  path: string;
  maps: string;
  worker: string;
}

/** Retain the startup URL until WebKit has consumed the worker's entry script. */
export async function createMathWorker(
  listener: (event: MessageEvent) => void,
  options: MathWorkerOptions,
): Promise<Worker> {
  const source = `self.maps = ${JSON.stringify(options.maps)}; importScripts(${JSON.stringify(`${options.path}/${options.worker}`)});`;
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  let worker: Worker;
  try {
    worker = new Worker(url);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    URL.revokeObjectURL(url);
    worker.removeEventListener('message', release);
    worker.removeEventListener('error', release);
  };
  worker.addEventListener('message', release, { once: true });
  worker.addEventListener('error', release, { once: true });
  worker.onmessage = listener;
  const terminate = worker.terminate.bind(worker);
  worker.terminate = () => {
    release();
    terminate();
  };
  return worker;
}
