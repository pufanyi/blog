import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { POSTS } from '../../data/posts';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  posts = POSTS;
}
