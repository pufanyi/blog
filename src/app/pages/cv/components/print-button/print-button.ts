import { Component } from '@angular/core';

@Component({
  selector: 'app-print-button',
  templateUrl: './print-button.html',
})
export class PrintButtonComponent {
  print(): void {
    window.print();
  }
}
