import { Component } from '@angular/core';
import { AutoAnimateDirective } from '../../../../directives/auto-animate';
import { CvSectionBase } from '../cv-section-base';

@Component({
  selector: 'app-abstract',
  imports: [AutoAnimateDirective],
  templateUrl: './abstract.html',
})
export class AbstractComponent extends CvSectionBase {}
