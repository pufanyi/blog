import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { pdfSource } from './pdf-source';

@Component({
  selector: 'app-pdf-viewer',
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PdfViewerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly destroyRef = inject(DestroyRef);
  protected readonly source = computed(() => pdfSource(this.params().get('file')));
  protected readonly ready = signal(false);
  protected readonly failed = signal(false);
  protected readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    // The library resolves this against <base href>; a leading slash duplicates it.
    pdfDefaultOptions.assetsFolder = 'assets/pdf-viewer';
    pdfDefaultOptions.enableScripting = false;
    pdfDefaultOptions.externalLinkTarget = 2;

    afterNextRender(() => {
      let themeRoot = document.documentElement;
      try {
        // Same-origin embeds follow the article's theme without reloading the PDF.
        themeRoot = window.parent.document.documentElement;
      } catch {
        // A standalone or externally embedded reader keeps its own theme.
      }
      const syncTheme = () => {
        const theme = themeRoot.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        this.theme.set(theme);
        if (document.documentElement.getAttribute('data-theme') !== theme) {
          document.documentElement.setAttribute('data-theme', theme);
        }
      };
      syncTheme();
      const observer = new MutationObserver(syncTheme);
      observer.observe(themeRoot, { attributes: true, attributeFilter: ['data-theme'] });
      this.destroyRef.onDestroy(() => observer.disconnect());
      this.ready.set(true);
    });
  }
}
