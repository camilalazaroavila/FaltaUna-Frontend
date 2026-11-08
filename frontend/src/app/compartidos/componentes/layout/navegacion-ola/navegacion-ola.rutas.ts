/**
 * Rutas de usuario explícitamente sin navegación lateral ni inferior.
 */
export const RUTAS_USUARIO_SIN_NAV: readonly string[] = [
  '/usuario/jugar',
  '/usuario/intercambio',
  '/usuario/tutorial',
] as const;

/**
 * Limpia una URL quitando query params, fragmentos y barra final.
 */
export function limpiarUrlNavegacion(url: string): string {
  const sinParametros = url.split('?')[0] || '';
  const limpia = sinParametros.split('#')[0] || '';
  return limpia.endsWith('/') && limpia.length > 1 ? limpia.slice(0, -1) : limpia;
}

/**
 * Determina si una URL corresponde a una vista de usuario que lleva navegación (ola lateral en desktop y barra inferior en mobile).
 * Es la única fuente de verdad consumida tanto por NavegacionOla como por Body.
 */
export function tieneNavUsuario(url: string): boolean {
  const limpia = limpiarUrlNavegacion(url);

  if (
    limpia === '' ||
    limpia === '/' ||
    limpia === '/empresa/landing' ||
    limpia.startsWith('/login') ||
    limpia.startsWith('/registro') ||
    limpia.startsWith('/empresa') ||
    limpia.startsWith('/juego') ||
    limpia.startsWith('/empleado') ||
    limpia.startsWith('/componentes')
  ) {
    return false;
  }

  // Si no pertenece al espacio de usuario, no lleva nav de usuario
  if (limpia !== '/usuario' && !limpia.startsWith('/usuario/')) {
    return false;
  }

  // Rutas de usuario explícitamente excluidas (Jugar, Intercambio y subrutas)
  for (const rutaSinNav of RUTAS_USUARIO_SIN_NAV) {
    if (limpia === rutaSinNav || limpia.startsWith(`${rutaSinNav}/`)) {
      return false;
    }
  }

  return true;
}

