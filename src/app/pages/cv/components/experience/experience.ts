import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';
import { CvSectionBase } from '../cv-section-base';

@Component({
  selector: 'app-experience',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './experience.html',
})
export class ExperienceComponent extends CvSectionBase {}
