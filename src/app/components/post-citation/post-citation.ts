import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

const SITE_URL = 'https://pufanyi.com';
const AUTHOR = 'Pu, Fanyi';

function escapeBibtex(value: string): string {
  return value.replace(/([&%#_{}])/g, '\\$1');
}

@Component({
  selector: 'app-post-citation',
  standalone: true,
  templateUrl: './post-citation.html',
  styleUrl: './post-citation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCitationComponent {
  readonly title = input.required<string>();
  readonly date = input.required<string>();
  readonly slug = input.required<string>();
  readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  readonly bibtex = computed(() => {
    const [year, month] = this.date().split('-');
    const keySlug = this.slug().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase() || 'post';

    return `@misc{pu${year}${keySlug},
  author = {${AUTHOR}},
  title  = {${escapeBibtex(this.title())}},
  year   = {${year}},
  month  = {${Number(month)}},
  url    = {${SITE_URL}/blog/${encodeURIComponent(this.slug())}}
}`;
  });

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.bibtex());
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }

    window.setTimeout(() => this.copyState.set('idle'), 1800);
  }
}
