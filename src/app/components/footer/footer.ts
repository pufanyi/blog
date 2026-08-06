import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.css',
})
export class FooterComponent {
  readonly lastUpdated = 'August 2026';
  readonly sourceCodeUrl = 'https://github.com/pufanyi/blog';
}
