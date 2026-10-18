import { afterEach, describe, expect, it } from 'vitest';
import { claimDynamicImportRecovery, isDynamicImportFailure } from './navigation-recovery';

describe('dynamic import navigation recovery', () => {
  afterEach(() => sessionStorage.clear());

  it.each([
    'Failed to fetch dynamically imported module: https://example.com/chunk-old.js',
    'Importing a module script failed.',
    'error loading dynamically imported module',
    'Loading chunk 42 failed',
  ])('recognizes browser chunk failures: %s', (message) => {
    expect(isDynamicImportFailure(new TypeError(message))).toBe(true);
  });

  it('does not classify an arbitrary navigation error as a chunk failure', () => {
    expect(isDynamicImportFailure(new Error('Resolver failed'))).toBe(false);
  });

  it('claims one reload per destination during the retry window', () => {
    const error = new TypeError('Failed to fetch dynamically imported module');
    expect(claimDynamicImportRecovery(() => sessionStorage, '/blog/first', error, 1_000)).toBe(
      true,
    );
    expect(claimDynamicImportRecovery(() => sessionStorage, '/blog/first', error, 2_000)).toBe(
      false,
    );
    expect(claimDynamicImportRecovery(() => sessionStorage, '/blog/second', error, 2_000)).toBe(
      true,
    );
    expect(claimDynamicImportRecovery(() => sessionStorage, '/blog/first', error, 32_000)).toBe(
      true,
    );
  });

  it('falls back to manual recovery when storage is unavailable', () => {
    expect(
      claimDynamicImportRecovery(
        () => {
          throw new DOMException('Blocked', 'SecurityError');
        },
        '/blog/example',
        new TypeError('Failed to fetch dynamically imported module'),
      ),
    ).toBe(false);
  });
});
