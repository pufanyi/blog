import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { typesetMath } from '../../math/mathjax';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './not-found.css',
})
export class NotFoundComponent implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reviewDialog = viewChild.required<ElementRef<HTMLDialogElement>>('reviewDialog');
  private reviewTrigger: HTMLElement | null = null;
  private readonly handleBackdropClick = (event: MouseEvent) => this.closeReviewFromBackdrop(event);

  readonly reviewOpen = signal(false);

  ngAfterViewInit(): void {
    void typesetMath(this.host.nativeElement);
    const dialog = this.reviewDialog().nativeElement;
    // Fallback for browsers without closedby="any" support; bound imperatively
    // so template a11y lint does not require key/tabindex handlers on <dialog>.
    dialog.addEventListener('click', this.handleBackdropClick);
    this.destroyRef.onDestroy(() => dialog.removeEventListener('click', this.handleBackdropClick));
  }

  submitPaper(): void {
    const dialog = this.reviewDialog().nativeElement;
    this.reviewTrigger =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
    this.reviewOpen.set(true);
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
      dialog.querySelector<HTMLButtonElement>('button')?.focus();
    }
  }

  closeReviewFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeReview();
    }
  }

  onDialogCancel(event: Event): void {
    event.preventDefault();
    this.closeReview();
  }

  onDialogClose(): void {
    this.reviewOpen.set(false);
    const trigger = this.reviewTrigger;
    this.reviewTrigger = null;
    if (trigger?.isConnected) {
      trigger.focus({ preventScroll: true });
    }
  }

  closeReview(): void {
    const dialog = this.reviewDialog().nativeElement;
    if (typeof dialog.close === 'function') {
      if (dialog.open) dialog.close();
      else this.onDialogClose();
    } else {
      dialog.removeAttribute('open');
      this.onDialogClose();
    }
  }
}

@Component({
  selector: 'app-not-found-page',
  imports: [NotFoundComponent],
  template: '<div class="paper"><main><app-not-found /></main></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
