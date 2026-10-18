import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CvHeader } from '../../../contracts/cv.model';
import { CV_DATA } from '../../data/cv';
import { ProfileSummaryComponent } from '../../shared/ui/profile-summary/profile-summary';

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
    links: CV_DATA.header.links.map((link) =>
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
