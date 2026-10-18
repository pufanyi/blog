import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface PageMetadata {
  title: string;
  tags: ({ name: string; content: string | null } | { property: string; content: string | null })[];
  links: { rel: string; href: string | null; type?: string }[];
  structuredData: Record<string, object | null>;
}

/** Applies a complete page description, including explicit removal of optional metadata. */
@Injectable({ providedIn: 'root' })
export class PageMetadataWriter {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: PageMetadata): void {
    this.title.setTitle(page.title);
    for (const tag of page.tags) {
      if (tag.content !== null) this.meta.updateTag({ ...tag, content: tag.content });
      else this.meta.removeTag('name' in tag ? `name="${tag.name}"` : `property="${tag.property}"`);
    }
    for (const { rel, href, type } of page.links) this.updateLink(rel, href, type);
    for (const [id, data] of Object.entries(page.structuredData))
      this.updateStructuredData(id, data);
  }

  private updateStructuredData(id: string, data: object | null): void {
    let script = this.document.head.querySelector<HTMLScriptElement>(`#${id}`);
    if (data === null) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    // Prevent authored raw-text delimiters from closing a prerendered script element.
    script.textContent = JSON.stringify(data).replaceAll('<', '\\u003c');
  }

  private updateLink(rel: string, href: string | null, type?: string): void {
    const selector = `link[rel="${rel}"]${type ? `[type="${type}"]` : ''}`;
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);
    if (href === null) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      if (type) link.type = type;
      this.document.head.appendChild(link);
    }
    link.href = href;
  }
}
