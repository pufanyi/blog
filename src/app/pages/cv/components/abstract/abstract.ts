import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CvAbstract } from '../../../../models/cv.model';

@Component({
  selector: 'app-abstract',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './abstract.html',
})
export class AbstractComponent {
  readonly data = input.required<CvAbstract>();
  readonly showHeading = input(true);
}
