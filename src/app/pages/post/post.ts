import { Component, computed, inject, effect } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { POSTS } from '../../data/posts';
import { PostHeaderComponent } from '../../components/post-header/post-header';
import { FooterComponent } from '../../components/footer/footer';
import { typesetMath, initCodeCopyButtons } from '../../utils/post-content-hooks';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [RouterLink, PostHeaderComponent, FooterComponent],
  templateUrl: './post.html',
  styleUrls: [
    './styles/typography.css',
    './styles/code-blocks.css',
    './styles/tables.css',
    './styles/media.css',
    './styles/layout.css',
  ],
})
export class PostComponent {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug'))));

  post = computed(() => {
    const s = this.slug();
    return POSTS.find(p => p.slug === s);
  });

  safeHtml = computed(() => {
    const p = this.post();
    return p ? this.sanitizer.bypassSecurityTrustHtml(p.contentHtml) : '';
  });

  constructor() {
    effect(() => {
      this.safeHtml();
      setTimeout(() => { typesetMath(); initCodeCopyButtons(); });
    });
  }
}
