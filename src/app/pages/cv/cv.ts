import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { SectionComponent } from './components/section/section';
import { EntryComponent } from './components/entry/entry';
import { ProfileSummaryComponent } from './components/profile-summary/profile-summary';
import { CV_DATA } from '../../data/cv';

@Component({
  selector: 'app-cv-page',
  standalone: true,
  imports: [ProfileSummaryComponent, SectionComponent, EntryComponent],
  templateUrl: './cv.html',
  styleUrl: './cv.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class CvPageComponent {
  readonly cv = CV_DATA;
}
