import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideIcons } from '@ng-icons/core';
import {
  phosphorPlusFill,
  phosphorCheckFill,
  phosphorXFill,
  phosphorWarningFill,
  phosphorInfoFill,
  phosphorStarFill,
  phosphorHeartFill,
  phosphorTrophyFill,
  phosphorGiftFill,
  phosphorCoinsFill,
  phosphorUserFill,
  phosphorLockFill,
  phosphorCaretRightFill,
  phosphorSealCheckFill,
} from '@ng-icons/phosphor-icons/fill';
import {
  heroPlusSolid,
  heroCheckSolid,
  heroXMarkSolid,
  heroExclamationTriangleSolid,
  heroInformationCircleSolid,
  heroStarSolid,
  heroHeartSolid,
  heroTrophySolid,
  heroGiftSolid,
  heroUserSolid,
  heroLockClosedSolid,
  heroBoltSolid,
  heroChevronRightSolid,
  heroSparklesSolid,
} from '@ng-icons/heroicons/solid';
import { routes } from './app.routes';

//test
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    ...provideIcons({
      phosphorPlusFill,
      phosphorCheckFill,
      phosphorXFill,
      phosphorWarningFill,
      phosphorInfoFill,
      phosphorStarFill,
      phosphorHeartFill,
      phosphorTrophyFill,
      phosphorGiftFill,
      phosphorCoinsFill,
      phosphorUserFill,
      phosphorLockFill,
      phosphorCaretRightFill,
      phosphorSealCheckFill,
      heroPlusSolid,
      heroCheckSolid,
      heroXMarkSolid,
      heroExclamationTriangleSolid,
      heroInformationCircleSolid,
      heroStarSolid,
      heroHeartSolid,
      heroTrophySolid,
      heroGiftSolid,
      heroUserSolid,
      heroLockClosedSolid,
      heroBoltSolid,
      heroChevronRightSolid,
      heroSparklesSolid,
    }),
  ],
};
