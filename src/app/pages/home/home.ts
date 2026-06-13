import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageLightboxComponent } from '../../components/image-lightbox/image-lightbox';
import { POSTS } from '../../data/posts';
import { AutoAnimateDirective } from '../../directives/auto-animate';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ImageLightboxComponent, AutoAnimateDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  posts = POSTS;
}
