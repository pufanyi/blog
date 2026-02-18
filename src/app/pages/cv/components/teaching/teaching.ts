import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';
import { CvSectionBase } from '../cv-section-base';

@Component({
  selector: 'app-teaching',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './teaching.html',
})
export class TeachingComponent extends CvSectionBase {}
