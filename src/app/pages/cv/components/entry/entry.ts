import { Component, input } from '@angular/core';
import { CvPublicationLink } from '../../../../models/cv.model';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.html',
})
export class EntryComponent {
  readonly title = input.required<string>();
  readonly date = input.required<string>();
  readonly detail = input<string>();
  readonly links = input<CvPublicationLink[]>();
  readonly items = input<string[]>();
}
