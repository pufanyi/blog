import { afterEach, describe, expect, it, vi } from 'vitest';
import { initCodeCopyButtons } from './post-content-hooks';

describe('code copy lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reports clipboard rejection, resets its label, and removes its listener', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const container = document.createElement('div');
    container.innerHTML =
      '<div class="code-block"><button class="code-copy">Copy</button><code>const value = 1;</code></div>';
    const cleanup = initCodeCopyButtons(container);
    const button = container.querySelector('button')!;
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(button.textContent).toBe('Copy failed');
    await vi.advanceTimersByTimeAsync(1800);
    expect(button.textContent).toBe('Copy');
    cleanup();
    button.click();
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it('ignores clipboard completion after leaving the article', async () => {
    let finish!: () => void;
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      },
    });
    const container = document.createElement('div');
    container.innerHTML =
      '<div class="code-block"><button class="code-copy">Copy</button><code>Example</code></div>';
    const cleanup = initCodeCopyButtons(container);
    const button = container.querySelector('button')!;
    button.click();
    cleanup();
    finish();
    await Promise.resolve();
    expect(button.textContent).toBe('Copy');
    expect(button.classList.contains('is-copied')).toBe(false);
  });
});
