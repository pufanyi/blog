import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { PageMetadataStrategy } from './services/page-metadata.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // PageScrollService consumes the router's saved positions and accounts
      // for article layout that settles after navigation and hydration.
      withInMemoryScrolling(),
    ),
    { provide: TitleStrategy, useClass: PageMetadataStrategy },
    provideClientHydration(withNoIncrementalHydration(), withEventReplay()),
  ],
};
