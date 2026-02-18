import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../../services/language.service';
import { SECTION_TITLES } from '../../../../constants/sections';
import { AutoAnimateDirective } from '../../../../directives/auto-animate';

@Component({
  selector: 'app-abstract',
  imports: [AutoAnimateDirective],
  templateUrl: './abstract.html',
})
export class AbstractComponent {
  protected readonly lang = inject(LanguageService).current;
  protected readonly t = SECTION_TITLES;
}
