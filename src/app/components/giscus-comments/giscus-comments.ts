import {
  Component,
  InjectionToken,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { COMMENTS_CONFIG } from '../../data/comments-config';
import { SITE_CONFIG } from '../../data/site-config';
import type { CommentsConfig } from '../../models/config.model';

export const GISCUS_CONFIG = new InjectionToken<CommentsConfig>('Giscus configuration', {
  providedIn: 'root',
  factory: () => COMMENTS_CONFIG,
});
export const GISCUS_SITE_URL = new InjectionToken<string>('Giscus site URL', {
  providedIn: 'root',
  factory: () => SITE_CONFIG.url,
});

@Component({
  selector: 'app-giscus-comments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<div class="giscus"></div>',
})
export class GiscusCommentsComponent implements OnDestroy {
  private readonly config = inject(GISCUS_CONFIG);
  private readonly siteUrl = inject(GISCUS_SITE_URL);
  private readonly themeService = inject(ThemeService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private loaded = false;

  constructor() {
    afterNextRender(() => this.load());
    effect(() => {
      const theme = this.themeService.theme();
      if (this.loaded) {
        this.syncTheme(theme);
      }
    });
  }

  ngOnDestroy(): void {
    this.loaded = false;
  }

  load(): void {
    if (!this.config.enabled || typeof document === 'undefined') {
      return;
    }

    const container = this.host.nativeElement.querySelector('.giscus');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', this.config.repo);
    script.setAttribute('data-repo-id', this.config.repoId);
    script.setAttribute('data-category', this.config.category);
    script.setAttribute('data-category-id', this.config.categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', this.config.reactionsEnabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', this.config.inputPosition);
    script.setAttribute('data-theme', this.getThemeValue());
    script.setAttribute('data-lang', this.config.language);
    script.crossOrigin = 'anonymous';
    script.async = true;
    container.appendChild(script);
    this.loaded = true;
  }

  private getThemeValue(theme: 'light' | 'dark' = this.themeService.theme()): string {
    return new URL(`/giscus-morandi-${theme}.css`, this.siteUrl).href;
  }

  private syncTheme(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') {
      return;
    }

    const iframe = this.host.nativeElement.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (!iframe?.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: this.getThemeValue(theme),
          },
        },
      },
      'https://giscus.app',
    );
  }
}
