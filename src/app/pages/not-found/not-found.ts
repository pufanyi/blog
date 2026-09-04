import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { typesetMath } from '../../utils/post-content-hooks';

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

  readonly reviewOpen = signal(false);

  ngAfterViewInit(): void {
    void typesetMath(this.host.nativeElement);
  }

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
