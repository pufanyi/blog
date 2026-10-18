import { describe, expect, it } from 'vitest';
import { PageChromeService } from './page-chrome.service';

describe('page chrome ownership', () => {
  it('ignores late updates and disposal from a page that has been replaced', () => {
    const chrome = new PageChromeService();
    const reader = chrome.register({ title: 'Chapter', readingDock: true });
    const docs = chrome.register({ title: 'Docs' });
    reader.update({ title: 'Late chapter', readingDock: true });
    reader.dispose();
    expect(chrome.title()).toBe('Docs');
    expect(chrome.readingDock()).toBe(false);
    docs.dispose();
    expect(chrome.title()).toBe('');
    expect(chrome.actions()).toEqual([]);
  });

  it('updates a reused page and releases its actions exactly once', () => {
    const chrome = new PageChromeService();
    const page = chrome.register({ title: 'First' });
    const action = {
      icon: 'ph-list',
      ariaLabel: 'Contents',
      title: 'Contents',
      action: () => undefined,
    };
    page.update({ title: 'Second', actions: [action], readingDock: true });
    expect(chrome.title()).toBe('Second');
    expect(chrome.actions()).toEqual([action]);
    page.dispose();
    page.dispose();
    page.update({ title: 'Disposed' });
    expect(chrome.title()).toBe('');
    expect(chrome.readingDock()).toBe(false);
  });
});
