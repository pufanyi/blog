import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';

@Component({
  selector: 'app-experience',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './experience.html',
})
export class ExperienceComponent {}
