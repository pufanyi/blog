import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { SearchModalComponent } from './modal/search-modal';

/** Shell entry point. Only this small launcher is eager; modal and corpus remain deferred. */
@Component({
  selector: 'app-search-launcher',
  imports: [SearchModalComponent],
  templateUrl: './search-launcher.html',
  styleUrl: './search-launcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchLauncherComponent {
  private readonly document = inject(DOCUMENT);
  readonly searchOpen = signal(false);
  readonly returnFocusTarget = signal<HTMLElement | null>(null);

  open(trigger?: HTMLElement): void {
    // Pass the actual pointer trigger; activeElement is not necessarily that button.
    this.returnFocusTarget.set(
      trigger ??
        (this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null),
    );
    this.searchOpen.set(true);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      if (this.searchOpen()) this.searchOpen.set(false);
      else this.open();
    }
  }
}
