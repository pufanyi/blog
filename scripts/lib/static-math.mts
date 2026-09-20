import { createRequire } from 'node:module';

// The bundled MathJax package has no declarations. Keep its Node boundary here.
interface MathDocument {
  document: unknown;
  math: Iterable<{ math: string; display: boolean; typesetRoot: unknown }>;
  render(): void;
  outputJax: { clearCache(): void; styleSheet(document: MathDocument): unknown };
}
interface MathEngine {
  config: { options: Record<string, unknown> };
  startup: {
    defaultReady(): void;
    input: unknown;
    getInputJax(): unknown;
    getDocument(html: string): MathDocument;
    adaptor: {
      body(document: unknown): unknown;
      innerHTML(node: unknown): string;
      textContent(node: unknown): string;
      setAttribute(node: unknown, name: string, value: string): void;
    };
    document: MathDocument;
  };
  texReset(): void;
  _: { mathjax: { mathjax: { handleRetriesFor(action: () => void): Promise<void> } } };
  init(options: object): Promise<MathEngine>;
}

let engine: Promise<MathEngine> | undefined;
let queue: Promise<unknown> = Promise.resolve();

function loadEngine(): Promise<MathEngine> {
  if (!engine) {
    const math = createRequire(import.meta.url)('mathjax') as MathEngine;
    engine = math.init({
      loader: { load: ['input/tex', 'output/chtml', 'a11y/assistive-mml'] },
      tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']] },
      chtml: {
        fontURL: '/assets/mathjax/woff2',
        displayOverflow: 'scroll',
        linebreaks: { inline: false },
      },
      startup: {
        typeset: false,
        ready: () => {
          // Node has no menu; MathJax's default startup supplies browser menu options.
          if (math.config.options) {
            delete math.config.options['enableMenu'];
            delete math.config.options['menuOptions'];
          }
          math.startup.defaultReady();
        },
      },
    });
  }
  return engine;
}

/** Serialize the shared TeX state and reset it between articles, including CSS usage. */
export function renderStaticMath(html: string): Promise<string> {
  if (!/\\[([]/.test(html)) return Promise.resolve(html);
  const result = queue.then(async () => {
    const math = await loadEngine();
    // A fresh input parser isolates authored macros as well as equation counters.
    math.startup.input = math.startup.getInputJax();
    math.startup.document.outputJax.clearCache();
    const document = math.startup.getDocument(html);
    await math._.mathjax.mathjax.handleRetriesFor(() => document.render());
    const adaptor = math.startup.adaptor;
    for (const item of document.math) {
      adaptor.setAttribute(item.typesetRoot, 'data-static-math', '');
      adaptor.setAttribute(item.typesetRoot, 'data-tex', item.math);
      adaptor.setAttribute(item.typesetRoot, 'tabindex', '0');
      adaptor.setAttribute(
        item.typesetRoot,
        'title',
        'Right-click or press Enter for math options',
      );
    }
    const body = adaptor.innerHTML(adaptor.body(document.document));
    const css = adaptor.textContent(document.outputJax.styleSheet(document));
    return `<style data-post-math-style>${css}</style>${body}`;
  });
  queue = result.catch(() => undefined);
  return result;
}
