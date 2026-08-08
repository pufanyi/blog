import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { CvAbstract, CvHeader } from '../../../../models/cv.model';
import { AbstractComponent } from '../abstract/abstract';
import { HeaderComponent } from '../header/header';

@Component({
  selector: 'app-profile-summary',
  imports: [HeaderComponent, AbstractComponent],
  templateUrl: './profile-summary.html',
  styleUrl: './profile-summary.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class ProfileSummaryComponent {
  readonly header = input.required<CvHeader>();
  readonly abstract = input.required<CvAbstract>();
}
