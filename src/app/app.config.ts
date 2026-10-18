import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { PageMetadataStrategy } from './app.metadata';
import { routes } from './app.routes';
import { POST_LOADERS } from './data/post-loaders';
import { POST_CONTENT_LOADERS } from './features/reader/data/post-loader.model';

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
    { provide: POST_CONTENT_LOADERS, useValue: POST_LOADERS },
    provideClientHydration(withNoIncrementalHydration(), withEventReplay()),
  ],
};
