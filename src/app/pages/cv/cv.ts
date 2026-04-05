import { Component, ViewEncapsulation } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { AbstractComponent } from './components/abstract/abstract';
import { SectionComponent } from './components/section/section';
import { EntryComponent } from './components/entry/entry';
import { CV_DATA } from '../../data/cv';

@Component({
  selector: 'app-cv-page',
  standalone: true,
  imports: [HeaderComponent, AbstractComponent, SectionComponent, EntryComponent],
  templateUrl: './cv.html',
  styleUrl: './cv.css',
  encapsulation: ViewEncapsulation.None,
})
export class CvPageComponent {
  readonly cv = CV_DATA;
}
