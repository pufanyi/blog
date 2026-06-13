import { Component, input } from '@angular/core';
import { ImageLightboxComponent } from '../image-lightbox/image-lightbox';

@Component({
  selector: 'app-post-header',
  standalone: true,
  imports: [ImageLightboxComponent],
  templateUrl: './post-header.html',
  styleUrl: './post-header.css',
})
export class PostHeaderComponent {
  title = input.required<string>();
  date = input.required<string>();
  coverImage = input<string>();
}
