import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CV_DATA } from '../../data/cv';
import { ProfileSummaryComponent } from '../../shared/ui/profile-summary/profile-summary';
import { EntryComponent } from './components/entry/entry';
import { SectionComponent } from './components/section/section';

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
