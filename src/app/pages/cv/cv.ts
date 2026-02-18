import { Component, ViewEncapsulation, viewChild, inject } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { AbstractComponent } from './components/abstract/abstract';
import { EducationComponent } from './components/education/education';
import { PublicationsComponent } from './components/publications/publications';
import { ExperienceComponent } from './components/experience/experience';
import { CompetitionsComponent } from './components/competitions/competitions';
import { TeachingComponent } from './components/teaching/teaching';
import { MiscellaneousComponent } from './components/miscellaneous/miscellaneous';
import { CvFooterComponent } from './components/cv-footer/cv-footer';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle';
import { TableOfContentsComponent } from './components/table-of-contents/table-of-contents';
import { PrintButtonComponent } from './components/print-button/print-button';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher';
import { ThemeService } from '../../services/theme.service';

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
    CvFooterComponent,
    ThemeToggleComponent,
    TableOfContentsComponent,
    PrintButtonComponent,
    LanguageSwitcherComponent,
  ],
  templateUrl: './cv.html',
  styleUrl: './cv.css',
  encapsulation: ViewEncapsulation.None,
})
export class CvPageComponent {
  readonly toc = viewChild(TableOfContentsComponent);
  readonly themeService = inject(ThemeService);

  toggleToc(): void {
    this.toc()?.toggle();
  }

  print(): void {
    window.print();
  }
}
