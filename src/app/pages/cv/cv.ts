import {
  Component,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CV_DATA } from '../../data/cv';

@Component({
  selector: 'app-cv-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cv.html',
  styleUrl: './cv.css',
  encapsulation: ViewEncapsulation.None,
})
export class CvPageComponent implements OnInit, OnDestroy {
  readonly cv = CV_DATA;
  readonly socialLinks = CV_DATA.header.links.filter(
    l => !l.internal && l.label !== 'Homepage',
  );
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.add('landing-active');
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('landing-active');
    }
  }
}
