import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { PageScrollService } from './services/page-scroll.service';
import { claimDynamicImportRecovery } from './utils/navigation-recovery';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  protected readonly loading = signal(false);
  protected readonly failedUrl = signal<string | null>(null);

  constructor() {
    inject(PageScrollService);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);
    const window = inject(DOCUMENT).defaultView;
    // Prerendered content stays visible during initial hydration.
    afterNextRender(() => {
      let pendingId: number | null = null;
      router.events.pipe(takeUntilDestroyed(destroyRef)).subscribe((event) => {
        if (event instanceof NavigationStart) {
          pendingId = event.id;
          this.failedUrl.set(null);
          this.loading.set(true);
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped
        ) {
          if (event.id !== pendingId) return;
          pendingId = null;
          this.loading.set(false);
          if (event instanceof NavigationError) {
            if (
              window &&
              claimDynamicImportRecovery(() => window.sessionStorage, event.url, event.error)
            ) {
              this.loading.set(true);
              window.location.assign(event.url);
              return;
            }
            this.failedUrl.set(event.url);
          }
        }
      });
    });
  }
}
