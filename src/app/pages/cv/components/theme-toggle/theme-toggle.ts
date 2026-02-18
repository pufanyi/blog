import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../../services/theme.service';
import { AutoAnimateDirective } from '../../../../directives/auto-animate';

@Component({
  selector: 'app-theme-toggle',
  imports: [AutoAnimateDirective],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);
}
