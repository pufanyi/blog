import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ImageLightboxComponent } from '../../../shared/ui/image-lightbox/image-lightbox';

@Component({
  selector: 'app-post-header',
  standalone: true,
  imports: [ImageLightboxComponent],
  templateUrl: './post-header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './post-header.css',
})
export class PostHeaderComponent {
  title = input.required<string>();
  date = input.required<string>();
  updated = input<string>();
  authors = input<readonly string[]>();
  coverImage = input<string>();
  authorsText = computed(() => this.authors()?.join(' · ') ?? '');
}
