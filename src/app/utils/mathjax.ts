import { createMathWorker } from './mathjax-worker';

interface MathJaxApi {
  loader?: { load: string[] };
  chtml?: { fontURL: string };
  output?: { displayOverflow: 'scroll' };
  tex?: { inlineMath: string[][]; displayMath: string[][] };
  startup?: {
    input?: string[];
    typeset?: boolean;
    promise?: Promise<unknown>;
    adaptor?: { createWorker: typeof createMathWorker };
  };
  typesetPromise?: (elements: HTMLElement[]) => Promise<unknown>;
  typesetClear?: (elements: HTMLElement[]) => void;
  whenReady?: (action: () => void) => Promise<void>;
}

declare global {
  interface Window {
    MathJax?: MathJaxApi;
  }
}

let loading: Promise<MathJaxApi> | undefined;
const SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-mml-chtml.js';

function loadMathJax(): Promise<MathJaxApi> {
  if (window.MathJax?.typesetPromise) return Promise.resolve(window.MathJax);
  if (loading) return loading;
  loading = new Promise<MathJaxApi>((resolve, reject) => {
    window.MathJax = {
      chtml: { fontURL: '/assets/mathjax/woff2' },
      tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']] },
      output: { displayOverflow: 'scroll' },
      startup: { typeset: false, input: ['tex', 'mml'] },
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
        if (api?.typesetPromise) {
          // MathJax 4.1.3 revokes its worker URL before WebKit can load it.
          if (api.startup?.adaptor) api.startup.adaptor.createWorker = createMathWorker;
          resolve(api);
        } else fail(new Error('MathJax did not initialize'));
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

/** Activate a single precompiled formula, preserving resolved macros/references via MathML. */
export async function activateStaticMath(
  formula: HTMLElement,
  signal: AbortSignal,
  point: { x: number; y: number } | null,
): Promise<void> {
  const mathml = formula.querySelector('mjx-assistive-mml > math')?.cloneNode(true);
  if (!mathml || signal.aborted) return;
  const api = await loadMathJax();
  if (signal.aborted || !formula.isConnected) return;
  const wrapper = document.createElement('span');
  wrapper.append(mathml);
  formula.replaceWith(wrapper);
  try {
    await api.typesetPromise?.([wrapper]);
    if (signal.aborted || !wrapper.isConnected) {
      api.typesetClear?.([wrapper]);
      return;
    }
    const rendered = wrapper.querySelector<HTMLElement>('mjx-container');
    if (!rendered) throw new Error('Math options did not initialize');
    rendered.dataset['tex'] = formula.dataset['tex'] ?? '';
    rendered.focus({ preventScroll: true });
    const rect = rendered.getBoundingClientRect();
    rendered.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        // MathJax positions its absolute menu from pageX/pageY. Without a view,
        // synthetic events report client coordinates as page coordinates and
        // focusing the menu scrolls long articles back toward the top.
        view: rendered.ownerDocument.defaultView,
        clientX: point?.x ?? rect.left,
        clientY: point?.y ?? rect.bottom,
      }),
    );
  } catch (error) {
    api.typesetClear?.([wrapper]);
    if (wrapper.isConnected) wrapper.replaceWith(formula);
    throw error;
  }
}
