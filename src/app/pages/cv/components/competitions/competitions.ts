import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { CvSectionBase } from '../cv-section-base';

@Component({
  selector: 'app-competitions',
  imports: [SectionComponent],
  templateUrl: './competitions.html',
})
export class CompetitionsComponent extends CvSectionBase {}
