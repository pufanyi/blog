import { Component, inject } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';
import { LanguageService } from '../../../../services/language.service';
import { SECTION_TITLES } from '../../../../constants/sections';

@Component({
  selector: 'app-experience',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './experience.html',
})
export class ExperienceComponent {
  protected readonly lang = inject(LanguageService).current;
  protected readonly t = SECTION_TITLES;
}
