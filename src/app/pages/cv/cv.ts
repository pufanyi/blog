import { Component, ViewEncapsulation } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { AbstractComponent } from './components/abstract/abstract';
import { EducationComponent } from './components/education/education';
import { PublicationsComponent } from './components/publications/publications';
import { ExperienceComponent } from './components/experience/experience';
import { CompetitionsComponent } from './components/competitions/competitions';
import { TeachingComponent } from './components/teaching/teaching';
import { MiscellaneousComponent } from './components/miscellaneous/miscellaneous';

@Component({
  selector: 'app-cv-page',
  standalone: true,
  imports: [
    HeaderComponent,
    AbstractComponent,
    EducationComponent,
    PublicationsComponent,
    ExperienceComponent,
    CompetitionsComponent,
    TeachingComponent,
    MiscellaneousComponent,
  ],
  templateUrl: './cv.html',
  styleUrl: './cv.css',
  encapsulation: ViewEncapsulation.None,
})
export class CvPageComponent {}
