import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../data/site-config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.css',
})
export class FooterComponent {
  readonly lastUpdated = SITE_CONFIG.footer.lastUpdated;
  readonly sourceCodeUrl = SITE_CONFIG.footer.sourceCodeUrl;
}
