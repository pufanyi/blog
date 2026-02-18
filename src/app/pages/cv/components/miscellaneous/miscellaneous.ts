import { Component, inject } from '@angular/core';
import { SectionComponent } from '../section/section';
import { LanguageService } from '../../../../services/language.service';
import { SECTION_TITLES } from '../../../../constants/sections';

@Component({
  selector: 'app-miscellaneous',
  imports: [SectionComponent],
  templateUrl: './miscellaneous.html',
})
export class MiscellaneousComponent {
  protected readonly lang = inject(LanguageService).current;
  protected readonly t = SECTION_TITLES;
}
