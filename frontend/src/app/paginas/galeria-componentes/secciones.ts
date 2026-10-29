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
    id: 'boton-opcion-juego',
    titulo: 'button[app-boton-opcion-juego]',
    descripcion: 'Paralelogramo con sombra solida, los cuatro rotulos de la pantalla de jugar.',
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
  {
    id: 'sobre-marca',
    titulo: 'app-sobre-marca',
    descripcion: 'Sobre con logo de marca: variantes, tamanos, proporciones y fallback.',
  },
  {
    id: 'carta',
    titulo: 'app-carta',
    descripcion:
      'Carta coleccionable con rareza, atributos, categoria, imagen y estado obtenida/no obtenida.',
  },
  {
    id: 'carta-popup',
    titulo: 'app-carta-popup',
    descripcion:
      'Detalle de una carta con rareza, categoria y oracion generica, abierto desde el gesto de tarjeta.',
  },
  {
    id: 'area-empresa',
    titulo: 'Área de empresa',
    descripcion:
      'Header, tarjeta de álbum, KPI, medidor de rareza y cupón de recompensa del panel de marcas (revisar en modo empresa).',
  },
  {
    id: 'texto',
    titulo: 'Texto',
    descripcion:
      'Directivas de contenido textual con todos sus tamaños, colores y etiquetas semánticas, en modo jugador y empresa a la vez.',
  },
   {
    id: 'tablero',
    titulo: 'tablero',
    descripcion:
      'Pantalla de partida armada con los átomos. Todo es mock: las zonas, las cartas, los puntajes y las barras salen de PartidaEstadoService.',
  },
  {
    id: 'cajas',
    titulo: 'Cajas',
    descripcion:
      'Contenedor de contenido con variantes, sombras, paddings, radios y slots, en modo jugador y empresa a la vez.',
  },
  {
    id: 'partida',
    titulo: 'Partida',
    descripcion:
      'Átomos de la pantalla de partida: casilla, contador de cupones, barra de puntos, chip de jugador, cabecera de turno y puntaje por zona.',
  },
  {
    id: 'navegacion-inferior-mobile',
    titulo: 'app-navegacion-inferior-mobile',
    descripcion:
      'Barra de navegación inferior mobile con botón flotante izquierdo abrazado por recorte cóncavo vectorial, en modo jugador y empresa.',
  },
] as const;
