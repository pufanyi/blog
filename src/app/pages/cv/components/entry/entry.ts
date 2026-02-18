import { Component, input } from '@angular/core';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.html',
})
export class EntryComponent {
  readonly title = input.required<string>();
  readonly date = input.required<string>();
}
