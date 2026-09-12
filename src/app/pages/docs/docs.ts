import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { DOCS } from '../../data/docs';
import { type DocPage, docMarkdownPath, docPath } from '../../models/doc.model';
import { PageScrollService } from '../../services/page-scroll.service';
import { ToolbarExtensionService } from '../../services/toolbar-extension.service';
import { initCodeCopyButtons } from '../../utils/post-content-hooks';

@Component({
  selector: 'app-docs',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './docs.html',
  styleUrls: [
    '../post/styles/typography.css',
    '../post/styles/code-blocks.css',
    '../post/styles/tables.css',
    './docs.css',
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly scroll = inject(PageScrollService);
  readonly doc = toSignal(this.route.data.pipe(map((data) => data['doc'] as DocPage)));
  readonly body = viewChild<ElementRef<HTMLElement>>('body');
  readonly filter = signal('');
  readonly groups = computed(() => {
    const query = this.filter().trim().toLocaleLowerCase();
    return [...new Set(DOCS.map((doc) => doc.group))]
      .map((title) => ({
        title,
        pages: DOCS.filter(
          (doc) =>
            doc.group === title &&
            `${doc.title} ${doc.description}`.toLocaleLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.pages.length);
  });
  readonly adjacent = computed(() => {
    const current = this.doc();
    const pages = DOCS.filter((doc) => doc.group === current?.group);
    const index = pages.findIndex((doc) => doc.slug === current?.slug);
    return { previous: pages[index - 1], next: pages[index + 1] };
  });
  readonly html = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.doc()?.contentHtml ?? ''),
  );
  readonly docPath = docPath;
  readonly markdownPath = docMarkdownPath;

  constructor() {
    const toolbar = inject(ToolbarExtensionService);
    toolbar.mobileTitle.set('Docs');
    inject(DestroyRef).onDestroy(() => toolbar.reset());
    afterRenderEffect((onCleanup) => {
      this.doc();
      const container = this.body()?.nativeElement;
      if (!container) return;
      const abort = new AbortController();
      const cleanup = initCodeCopyButtons(container);
      container.dataset['rendered'] = 'true';
      container.addEventListener(
        'click',
        (event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const link =
            event.target instanceof Element
              ? event.target.closest<HTMLAnchorElement>('a[href]')
              : null;
          if (!link || link.target || link.hasAttribute('download')) return;
          const url = new URL(link.href);
          if (
            url.origin !== container.ownerDocument.location.origin ||
            !/^\/docs(?:\/|$)/.test(url.pathname) ||
            url.pathname.endsWith('.md')
          )
            return;
          event.preventDefault();
          void this.router.navigateByUrl(`${url.pathname}${url.search}${url.hash}`);
        },
        { signal: abort.signal },
      );
      void container.ownerDocument.fonts?.ready.then(() => {
        if (!abort.signal.aborted) this.scroll.contentSettled(container);
      });
      onCleanup(() => {
        abort.abort();
        cleanup();
        delete container.dataset['rendered'];
      });
    });
  }

  closeMenu(link: HTMLAnchorElement): void {
    link.closest('details')?.removeAttribute('open');
  }
}
