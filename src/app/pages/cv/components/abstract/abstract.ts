import { Component, input } from '@angular/core';
import { CvAbstract } from '../../../../models/cv.model';

@Component({
  selector: 'app-abstract',
  templateUrl: './abstract.html',
})
export class AbstractComponent {
  readonly data = input.required<CvAbstract>();
}
