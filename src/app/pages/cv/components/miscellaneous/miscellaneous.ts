import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { CvSectionBase } from '../cv-section-base';

@Component({
  selector: 'app-miscellaneous',
  imports: [SectionComponent],
  templateUrl: './miscellaneous.html',
})
export class MiscellaneousComponent extends CvSectionBase {}
