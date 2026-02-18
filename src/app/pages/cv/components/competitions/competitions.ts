import { Component, inject } from '@angular/core';
import { SectionComponent } from '../section/section';
import { LanguageService } from '../../../../services/language.service';
import { SECTION_TITLES } from '../../../../constants/sections';

@Component({
  selector: 'app-competitions',
  imports: [SectionComponent],
  templateUrl: './competitions.html',
})
export class CompetitionsComponent {
  protected readonly lang = inject(LanguageService).current;
  protected readonly t = SECTION_TITLES;
}
