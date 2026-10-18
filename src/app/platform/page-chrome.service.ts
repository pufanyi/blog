import { computed, Injectable, signal, untracked } from '@angular/core';

export interface PageAction {
  icon: string;
  ariaLabel: string;
  title: string;
  action: (trigger: HTMLElement) => void;
  toggleIcon?: string;
  isToggled?: () => boolean;
  ariaControls?: string;
  isExpanded?: () => boolean;
}

export interface PageChrome {
  title?: string;
  actions?: readonly PageAction[];
  readingDock?: boolean;
}

/** A route page owns its registration; releasing an old page cannot reset a new one. */
@Injectable({ providedIn: 'root' })
export class PageChromeService {
  private readonly current = signal<{ owner: symbol; value: PageChrome } | null>(null);
  readonly title = computed(() => this.current()?.value.title ?? '');
  readonly actions = computed(() => this.current()?.value.actions ?? []);
  readonly readingDock = computed(() => this.current()?.value.readingDock ?? false);

  register(initial: PageChrome = {}) {
    const owner = Symbol('page');
    this.current.set({ owner, value: initial });
    return {
      update: (value: PageChrome) => {
        if (untracked(this.current)?.owner === owner) this.current.set({ owner, value });
      },
      dispose: () => {
        if (untracked(this.current)?.owner === owner) this.current.set(null);
      },
    };
  }
}
