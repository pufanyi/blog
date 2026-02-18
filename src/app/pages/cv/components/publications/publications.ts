import { Component, inject } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';
import { LanguageService } from '../../../../services/language.service';
import { SECTION_TITLES } from '../../../../constants/sections';

@Component({
  selector: 'app-publications',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './publications.html',
})
export class PublicationsComponent {
  protected readonly lang = inject(LanguageService).current;
  protected readonly t = SECTION_TITLES;
}
