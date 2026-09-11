import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { blogDirectoryPath } from '../../utils/blog-directories';

@Component({
  selector: 'app-blog-breadcrumbs',
  imports: [RouterLink],
  templateUrl: './blog-breadcrumbs.html',
  styleUrl: './blog-breadcrumbs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogBreadcrumbsComponent {
  readonly slug = input.required<string>();
  readonly current = input(true);
  readonly items = computed(() => {
    const parts = this.slug().split('/').filter(Boolean);
    return [
      { label: 'Contents', path: blogDirectoryPath('') },
      ...parts.map((label, index) => ({ label, path: blogDirectoryPath(parts.slice(0, index + 1).join('/')) })),
    ];
  });
}
