import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CV_DATA } from '../../data/cv';
import { ProfileSummaryComponent } from '../cv/components/profile-summary/profile-summary';

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, ProfileSummaryComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProfilePageComponent {
  readonly cv = CV_DATA;
}
