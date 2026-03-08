import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';

@Component({
  selector: 'app-teaching',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './teaching.html',
})
export class TeachingComponent {}
