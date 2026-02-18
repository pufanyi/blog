import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';
import { CvSectionBase } from '../cv-section-base';

@Component({
  selector: 'app-education',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './education.html',
})
export class EducationComponent extends CvSectionBase {}
