import { Component, computed, inject, OnInit, OnDestroy, signal, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { REDIRECTS } from '../../data/redirects';

@Component({
  selector: 'app-redirect',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './redirect.html',
  styleUrl: './redirect.css',
})
export class RedirectComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  private path = computed(() => this.route.snapshot.paramMap.get('path') ?? '');

  redirect = computed(() => REDIRECTS.find(r => r.from === this.path()));

  displayName = computed(() => this.redirect()?.title || this.path());
  targetUrl = computed(() => this.redirect()?.to ?? '');

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
