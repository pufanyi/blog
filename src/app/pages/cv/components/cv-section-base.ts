import { inject } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { SECTION_TITLES } from '../../../constants/sections';

export abstract class CvSectionBase {
  protected readonly lang = inject(LanguageService).current;
  protected readonly t = SECTION_TITLES;
}
