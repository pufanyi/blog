import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';
import { CvSectionBase } from '../cv-section-base';

@Component({
  selector: 'app-publications',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './publications.html',
})
export class PublicationsComponent extends CvSectionBase {}
