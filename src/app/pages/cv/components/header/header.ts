import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageLightboxComponent } from '../../../../components/image-lightbox/image-lightbox';
import { CvHeader } from '../../../../models/cv.model';

@Component({
  selector: 'app-header',
  imports: [ImageLightboxComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './header.html',
})
export class HeaderComponent {
  readonly data = input.required<CvHeader>();
}
