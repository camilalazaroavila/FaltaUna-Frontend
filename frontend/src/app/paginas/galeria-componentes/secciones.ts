/**
 * Índice de la galería de componentes.
 *
 * Es la única fuente de verdad del menu de navegacion superior: el shell lo
 * recorre con `@for` para generar las anclas. Para sumar una seccion nueva
 * alcanza con agregar una entrada aca y su etiqueta en
 * `galeria-componentes.html`.
 *
 * El orden debe coincidir con el de las etiquetas del template; el spec
 * `galeria-componentes.spec.ts` falla si se desincronizan.
 */
export interface SeccionGaleria {
  /** Ancla del indice y `id` del `<section>` renderizado. */
  readonly id: string;
  /** Nombre del selector o del grupo de tokens. */
  readonly titulo: string;
  readonly descripcion: string;
}

export const SECCIONES: readonly SeccionGaleria[] = [
  {
    id: 'tokens',
    titulo: 'Tokens',
    descripcion: 'Paleta semantica, escala de feedback, tipografias, radios y sombras.',
  },
  {
    id: 'boton',
    titulo: 'button[app-boton]',
    descripcion: 'Matriz variante x tamano, formas y estados del boton base.',
  },
  {
    id: 'badge',
    titulo: 'app-badge',
    descripcion: 'Siete variantes en dos tamanos, con y sin punto.',
  },
  {
    id: 'navegacion-circular',
    titulo: 'app-boton-navegacion-circular',
    descripcion: 'Tamanos, activo, deshabilitado, insignia y barra lateral simulada.',
  },
    {
    id: 'boton-jugar',
    titulo: 'app-boton-jugar',
    descripcion: 'CTA hero con halo y rebote de GSAP.',
  },
  {
    id: 'boton-flotante',
    titulo: 'app-boton-flotante',
    descripcion: 'Accion flotante con y sin contador.',
  },
  {
    id: 'boton-icono',
    titulo: 'app-boton-icono',
    descripcion: 'Control compacto de una sola accion, sin texto visible.',
  },
] as const;