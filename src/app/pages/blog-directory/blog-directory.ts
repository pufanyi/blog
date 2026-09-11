import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { BlogBreadcrumbsComponent } from '../../components/blog-breadcrumbs/blog-breadcrumbs';
import { blogDirectoryPath, type BlogDirectory } from '../../utils/blog-directories';

@Component({
  selector: 'app-blog-directory',
  imports: [RouterLink, BlogBreadcrumbsComponent],
  templateUrl: './blog-directory.html',
  styleUrl: './blog-directory.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogDirectoryComponent {
  readonly directoryPath = blogDirectoryPath;
  readonly directory = toSignal(inject(ActivatedRoute).data.pipe(map(data => data['directory'] as BlogDirectory)));
}
