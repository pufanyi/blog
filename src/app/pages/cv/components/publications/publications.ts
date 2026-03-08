import { Component } from '@angular/core';
import { SectionComponent } from '../section/section';
import { EntryComponent } from '../entry/entry';

@Component({
  selector: 'app-publications',
  imports: [SectionComponent, EntryComponent],
  templateUrl: './publications.html',
})
export class PublicationsComponent {}
