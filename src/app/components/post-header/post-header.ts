import { Component, input } from '@angular/core';

@Component({
  selector: 'app-post-header',
  standalone: true,
  templateUrl: './post-header.html',
  styleUrl: './post-header.css',
})
export class PostHeaderComponent {
  title = input.required<string>();
  date = input.required<string>();
}
