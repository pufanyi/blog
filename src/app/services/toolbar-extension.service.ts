import { Injectable, signal } from '@angular/core';

export interface ToolbarExtraButton {
  icon: string;
  ariaLabel: string;
  title: string;
  action: () => void;
  toggleIcon?: string;
  isToggled?: () => boolean;
}

@Injectable({ providedIn: 'root' })
export class ToolbarExtensionService {
  readonly mobileTitle = signal('Home');
  readonly leadingButtons = signal<ToolbarExtraButton[]>([]);

  reset(): void {
    this.mobileTitle.set('Home');
    this.leadingButtons.set([]);
  }
}
