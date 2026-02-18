import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from '../toolbar/toolbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-blog-shell',
  standalone: true,
  imports: [RouterOutlet, ToolbarComponent, FooterComponent],
  templateUrl: './blog-shell.html',
  styleUrl: './blog-shell.css',
})
export class BlogShellComponent {}
