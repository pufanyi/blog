import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CvHeader } from '../../../../../contracts/cv.model';
import { ImageLightboxComponent } from '../../image-lightbox/image-lightbox';

@Component({
  selector: 'app-header',
  imports: [ImageLightboxComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './header.html',
})
export class HeaderComponent {
  readonly data = input.required<CvHeader>();
}
