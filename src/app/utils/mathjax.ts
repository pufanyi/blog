interface MathJaxApi {
  tex?: { inlineMath: string[][]; displayMath: string[][] };
  startup?: { typeset?: boolean; promise?: Promise<unknown> };
  typesetPromise?: (elements: HTMLElement[]) => Promise<unknown>;
  typesetClear?: (elements: HTMLElement[]) => void;
}

declare global {
  interface Window {
    MathJax?: MathJaxApi;
  }
}

let loading: Promise<MathJaxApi> | undefined;
const SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js';

function loadMathJax(): Promise<MathJaxApi> {
  if (window.MathJax?.typesetPromise) return Promise.resolve(window.MathJax);
  if (loading) return loading;
  loading = new Promise<MathJaxApi>((resolve, reject) => {
    window.MathJax = {
      tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']] },
      startup: { typeset: false },
    };
    const script = document.createElement('script');
    script.id = 'MathJax-script';
    script.src = SCRIPT_URL;
    script.async = true;
    const fail = (error: unknown) => {
      script.remove();
      loading = undefined;
      reject(error);
    };
    script.onerror = () => fail(new Error('Could not load MathJax'));
    script.onload = () => {
      const api = window.MathJax;
      void Promise.resolve(api?.startup?.promise).then(() => {
        if (api?.typesetPromise) resolve(api);
        else fail(new Error('MathJax did not initialize'));
      }, fail);
    };
    document.head.appendChild(script);
  });
  return loading;
}

export async function typesetMath(container: HTMLElement, signal?: AbortSignal): Promise<void> {
  if (
    typeof window === 'undefined' ||
    signal?.aborted ||
    !/\\[([]/.test(container.textContent ?? '')
  )
    return;
  try {
    const api = await loadMathJax();
    await api.startup?.promise;
    if (signal?.aborted || !container.isConnected) return;
    await api.typesetPromise?.([container]);
    if (signal?.aborted || !container.isConnected) api.typesetClear?.([container]);
  } catch (error) {
    if (!signal?.aborted) console.error('MathJax typeset failed', error);
  }
}

export function clearMath(container: HTMLElement): void {
  if (typeof window !== 'undefined') window.MathJax?.typesetClear?.([container]);
}
