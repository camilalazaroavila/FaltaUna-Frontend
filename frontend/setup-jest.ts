import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

/**
 * jsdom no implementa `window.matchMedia`. `ngx-sonner` lo consulta al
 * construirse (`<ngx-sonner-toaster>` vive en el shell de `App`), asi que sin
 * este stub cualquier suite que renderice el shell falla.
 *
 * Se reporta `matches: false` siempre: el comportamiento por defecto es que
 * el usuario no pidio menos movimiento, que es el caso base del diseno.
 */
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (consulta: string): MediaQueryList =>
      ({
        media: consulta,
        matches: false,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}