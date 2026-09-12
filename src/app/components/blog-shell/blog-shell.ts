import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer';
import { ToolbarComponent } from '../toolbar/toolbar';

@Component({
  selector: 'app-blog-shell',
  standalone: true,
  imports: [RouterOutlet, ToolbarComponent, FooterComponent],
  templateUrl: './blog-shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './blog-shell.css',
})
export class BlogShellComponent {}
