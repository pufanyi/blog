import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CvAbstract } from '../../../../../contracts/cv.model';

@Component({
  selector: 'app-abstract',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './abstract.html',
})
export class AbstractComponent {
  readonly data = input.required<CvAbstract>();
  readonly showHeading = input(true);
}
