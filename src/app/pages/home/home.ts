import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ImageLightboxComponent } from '../../components/image-lightbox/image-lightbox';
import { BLOG_CONFIG } from '../../data/blog-config';
import { SITE_CONFIG } from '../../data/site-config';
import { NotFoundComponent } from '../not-found/not-found';
import { blogPagePath, paginationItems, type BlogPage } from '../../utils/blog-pagination';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ImageLightboxComponent, NotFoundComponent],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.css',
})
export class HomeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private focusedNavigation = -1;
  readonly config = BLOG_CONFIG;
  readonly title = SITE_CONFIG.title;
  readonly page = toSignal(this.route.data.pipe(map(data => data['blogPage'] as BlogPage | null)), {
    initialValue: null,
  });
  readonly pageItems = computed(() => {
    const page = this.page();
    return page ? paginationItems(page.number, page.totalPages) : [];
  });
  readonly pagePath = blogPagePath;
  readonly paginationState = { blogPagination: true };

  constructor() {
    afterRenderEffect(() => {
      const page = this.page();
      const navigation = this.router.lastSuccessfulNavigation();
      const heading = this.heading()?.nativeElement;
      if (
        page && heading && navigation?.trigger === 'imperative' &&
        navigation.extras.state?.['blogPagination'] && navigation.id !== this.focusedNavigation
      ) {
        heading.focus({ preventScroll: true });
        this.focusedNavigation = navigation.id;
      }
    });
  }
}
