import { Component, computed, inject, OnInit, OnDestroy, signal, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Redirect } from '../../models/redirect.model';

@Component({
  selector: 'app-redirect',
  standalone: true,
  templateUrl: './redirect.html',
  styleUrl: './redirect.css',
})
export class RedirectComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  redirect = computed(() => this.route.snapshot.data['redirect'] as Redirect | undefined);

  displayName = computed(() => this.redirect()?.title || this.redirect()?.from || '');

  targetUrl = computed(() => {
    const r = this.redirect();
    if (!r) return '';
    // Get the full URL path and extract the sub-path after the redirect prefix
    const fullPath = this.router.url.replace(/^\//, '');
    const subPath = fullPath.startsWith(r.from)
      ? fullPath.slice(r.from.length).replace(/^\//, '')
      : '';
    // Append sub-path to target, ensuring proper slash handling
    const base = r.to.endsWith('/') ? r.to : r.to + '/';
    return subPath ? base + subPath : r.to;
  });

  countdown = signal(5);
  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.redirect()) return;

    this.timerId = setInterval(() => {
      const next = this.countdown() - 1;
      if (next <= 0) {
        this.clearTimer();
        window.location.href = this.targetUrl();
      } else {
        this.countdown.set(next);
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private clearTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
