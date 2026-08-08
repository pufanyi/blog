import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CV_DATA } from '../../data/cv';
import { CvHeader } from '../../models/cv.model';
import { ProfileSummaryComponent } from '../cv/components/profile-summary/profile-summary';

@Component({
  selector: 'app-profile-page',
  imports: [ProfileSummaryComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProfilePageComponent {
  readonly cv = CV_DATA;
  readonly header: CvHeader = {
    ...CV_DATA.header,
    links: CV_DATA.header.links.map(link =>
      link.label === 'Homepage'
        ? {
            icon: 'ph-identification-card',
            href: '/cv',
            label: 'Curriculum Vitae',
            internal: true,
          }
        : link,
    ),
  };
}
