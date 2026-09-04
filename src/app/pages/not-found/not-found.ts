import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './not-found.css',
})
export class NotFoundComponent {
  readonly reviewOpen = signal(false);

  submitPaper(): void {
    this.reviewOpen.set(true);
  }

  closeReviewFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.reviewOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeReview(): void {
    this.reviewOpen.set(false);
  }
}
