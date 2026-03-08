import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageLightboxComponent } from '../../../../components/image-lightbox/image-lightbox';

@Component({
  selector: 'app-header',
  imports: [ImageLightboxComponent, RouterLink],
  templateUrl: './header.html',
})
export class HeaderComponent {}
