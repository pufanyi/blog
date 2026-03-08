import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';

@Component({
  selector: 'app-education',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './education.html',
})
export class EducationComponent {}
