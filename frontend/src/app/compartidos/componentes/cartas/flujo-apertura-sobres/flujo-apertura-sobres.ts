import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SobresService } from '@servicios/sobres.service';
import { AuthService } from '@servicios/auth.service';
import type { SobreInventarioUsuario, SobreAbiertoUsuario} from '@servicios/sobres.service';
import { PanelDesplazable } from '@compartidos/componentes/controles/panel-desplazable/panel-desplazable';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { SobreMarca } from '@compartidos/componentes/cartas/sobre-marca/sobre-marca';
import type { VarianteSobreMarca } from '@compartidos/componentes/cartas/sobre-marca/sobre-marca';
import {
  AperturaSobreRespuesta,
  CartaObtenidaRespuesta,
  SobreItemUI,
  SobreRespuesta,
} from '@modelos/sobre.model';
import type { Carta, CategoriaCarta } from '@modelos/carta.model';
import { categoriaCartaDesdeNombre, rarezaDesdeNombre } from '@modelos/carta.model';
import { categoriaDesdeNombre } from '@modelos/categoria.model';
import type { CategoriaSobre } from '@modelos/categoria.model';
import { CARTAS_MOCK } from '@modelos/cartas.mock';

export type FaseApertura = 'cerrado' | 'seleccion' | 'preview' | 'carrusel' | 'corte' | 'revelacion';

/** Inputs de `app-sobre-marca` que corresponden a un sobre del flujo. */
export interface PropsSobre {
  readonly categoria: CategoriaSobre | null;
  readonly variante: VarianteSobreMarca;
  readonly nombre: string | null;
  readonly logoUrl: string | null;
}

export interface SobreInicialApertura {
  readonly sobreId: number;
  readonly tipo: 'GENERAL' | 'CATEGORIA' | 'MARCA';
  readonly etiqueta?: string;
}

/** Cuántas cartas trae el sobre gratuito (general). Coincide con `Sobre General` en la base. */
const CARTAS_SOBRE_DIARIO = 5;

/**
 * Cartas del mock que usa ESTE flujo
 * Cambiá estos dos números para usar otro rango; el resto del mock no se toca.
 */
const ID_MOCK_DESDE = 28;
const ID_MOCK_HASTA = 39;

const numeroDeId = (id: string): number => Number(id.replace(/\D/g, ''));

const CARTAS_DEL_FLUJO: readonly Carta[] = CARTAS_MOCK.filter((c) => {
  const n = numeroDeId(c.id);
  return n >= ID_MOCK_DESDE && n <= ID_MOCK_HASTA;
});

/** La categoría del sobre (backend) se llama distinto que la de la carta: acá se traduce. */
const CATEGORIA_SOBRE_A_CARTA: Record<CategoriaSobre, CategoriaCarta> = {
  tecnologia: 'tecnologia',
  cosmetica: 'cosmeticos',
  entretenimiento: 'entretenimiento',
  gastronomia: 'gastronomia',
  indumentaria: 'indumentaria',
  musica: 'musica',
};

/** Qué tan seguido sale cada rareza al sortear (mientras más alto, más frecuente). */
const PESO_POR_RAREZA: Record<Carta['rareza'], number> = {
  comun: 6,
  rara: 3,
  epicarta: 2,
  legendaria: 1,
};

/**
 * Logos provisorios por nombre de marca (clave normalizada: minúsculas, sin
 * tildes ni símbolos). Solo se usan si el backend no manda `logoUrl`.
 * Una marca que no esté acá ni traiga logo se dibuja con el envoltorio genérico.
 */
const LOGOS_MARCA_PROVISORIOS: Readonly<Record<string, string>> = {
  mcdonalds: 'imagenes/McDonalds.jpg',
  lego: 'imagenes/lego.png',
  grido: 'imagenes/grido.jpg',
  zara: 'imagenes/zara.png',
  cocacola: 'imagenes/cocacola.jpg',
  sony: 'imagenes/sony.png',
  google: 'imagenes/google.jpg',
  sprite: 'imagenes/Sprite.png',
};

const claveMarca = (nombre: string): string =>
  nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Altura (en % del sobre) donde pasa la línea de corte. */
const LINEA_CORTE = 22;

/** Corte recto: la mitad de arriba termina justo donde empieza la de abajo. */
const CLIP_SUPERIOR = `inset(0 0 ${100 - LINEA_CORTE}% 0)`;
const CLIP_INFERIOR = `inset(${LINEA_CORTE}% 0 0 0)`;

@Component({
  selector: 'app-flujo-apertura-sobres',
  standalone: true,
  imports: [NgTemplateOutlet, PanelDesplazable, CartaComponent, SobreMarca],
  templateUrl: './flujo-apertura-sobres.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlujoAperturaSobres {
  private readonly sobresService = inject(SobresService);
  private readonly authService = inject(AuthService);

  // Inputs
  readonly abierto = input<boolean>(false);
  readonly sobresCatalogo = input<readonly SobreRespuesta[]>([]);
  readonly sobresDiariosDisponibles = input<number>(2);
  readonly sobresInventario = input<readonly SobreInventarioUsuario[]>([]);
  /** Sobre con el que abrir directamente (reclamo de misión). `null` = grilla normal. */
  readonly sobreInicial = input<SobreInicialApertura | null>(null);

  // Outputs
  readonly cerrar = output<void>();
  readonly aperturaRealizada = output<AperturaSobreRespuesta>();

  // Estado del flujo
  protected readonly fase = signal<FaseApertura>('seleccion');
  protected readonly sobreSeleccionado = signal<SobreItemUI | null>(null);
  protected readonly indiceCarrusel = signal<number>(0);
  protected readonly dragOffset = signal<number>(0);
  protected readonly cortando = signal<boolean>(false);
  protected readonly sobreCortado = signal<boolean>(false);
  protected readonly cargandoApertura = signal<boolean>(false);
  protected readonly errorApertura = signal<string | null>(null);
  protected readonly cartasObtenidas = signal<CartaObtenidaRespuesta[]>([]);
  protected readonly indiceCartaActual = signal<number>(0);

  /** Controla la animación de entrada de cada carta revelada. */
  protected readonly animarCarta = signal(true);

  /** Las mismas cartas, convertidas al modelo `Carta` que consume `app-carta`. */
  protected readonly cartasUI = signal<Carta[]>([]);
  /** Carta que se muestra en la revelación (o null si no hay). */
  protected readonly cartaActual = computed(
    () => this.cartasUI()[this.indiceCartaActual()] ?? null,
  );

  /** Para cada carta del sobre actual (misma posición que `cartasUI`): true si ya la habías obtenido antes. */
  protected readonly repetidas = signal<boolean[]>([]);
  protected readonly esRepetida = computed(() => this.repetidas()[this.indiceCartaActual()] ?? false);

  readonly sobresAbiertos = input<readonly SobreAbiertoUsuario[]>([]);

  private readonly abiertosLocal = signal<SobreAbiertoUsuario[]>([]);

  private claveAbiertos(): string {
    const usuarioId = this.authService.usuarioActual()?.id ?? 1;
    return `faltauna.sobres-abiertos.${usuarioId}`;
  }

  private leerAbiertosLocal(): SobreAbiertoUsuario[] {
    try {
      return JSON.parse(localStorage.getItem(this.claveAbiertos()) ?? '[]');
    } catch {
      return [];
    }
  }

  private registrarAbierto(sobre: SobreItemUI): void {
    const id = Number(sobre.id);
    const lista = [...this.abiertosLocal()];
    const i = lista.findIndex((a) => a.sobreId === id);
    if (i >= 0) {
      lista[i] = { ...lista[i], cantidadAbiertos: lista[i].cantidadAbiertos + 1 };
    } else {
      lista.push({ sobreId: id, nombre: sobre.nombre, tipo: sobre.tipo, cantidadAbiertos: 1 });
    }
    this.abiertosLocal.set(lista);
    try {
      localStorage.setItem(this.claveAbiertos(), JSON.stringify(lista));
    } catch { }
  }

  // Animación de corte
  protected readonly lineaCorte = LINEA_CORTE;
  protected readonly clipSuperior = CLIP_SUPERIOR;
  protected readonly clipInferior = CLIP_INFERIOR;

  protected readonly Math = Math;

  // Variables de control de arrastre
  protected enArrastre = false;
  private dragInicioX = 0;
  private corteInicioX = 0;
  private arrastrandoCorte = false;
  private readonly escena = viewChild<ElementRef<HTMLElement>>('escena');
  /** Evita que el click residual posterior a un arrastre elija un sobre. */
  private ignorarClic = false;

  constructor() {
    // Al abrir el modal, reiniciar automáticamente a la fase de selección
    // Al abrir el modal, reiniciar automáticamente a la fase de selección.
    // Si llega un `sobreInicial` (reclamo de misión), saltamos la grilla y
    // entramos directo a la vista previa de ese sobre.
    effect(() => {
      const abierto = this.abierto();
      const inicial = this.sobreInicial();
      if (!abierto) return;

      untracked(() => {
        this.iniciar();
        if (inicial) {
          this.seleccionarSobre(this.resolverSobreInicial(inicial));
        }
      });
    });
  }

  /**
   * Resuelve el sobre acreditado por su `sobreId`. Primero contra la grilla
   * (inventario ya cargado) y, si todavía no llegó la respuesta, contra el
   * catálogo. Nunca cae al sobre diario: ese tiene su propio límite de cargas y
   * abrirlo por error consumiría una apertura del día.
   */
  private resolverSobreInicial(descriptor: SobreInicialApertura): SobreItemUI {
    const enGrilla = this.listaSobresUI().find(
      (item) => !item.esDiario && item.disponible && Number(item.id) === descriptor.sobreId,
    );
    
    if (enGrilla) return enGrilla;

    const delCatalogo = this.sobresCatalogo().find((s) => s.id === descriptor.sobreId);
    if (delCatalogo) {
      return {
        id: delCatalogo.id,
        nombre: delCatalogo.nombre,
        etiqueta: (delCatalogo.marca ?? delCatalogo.categoria ?? delCatalogo.nombre).toUpperCase(),
        tipo: delCatalogo.tipo,
        precio: delCatalogo.precio ?? 0,
        cantidadCartas: delCatalogo.cantidadCartas,
        esDiario: false,
        disponible: true,
        categoria: delCatalogo.categoria ?? null,
        marca: delCatalogo.marca ?? null,
        logoUrl: delCatalogo.logoUrl ?? null,
      };
    }

    // Último recurso: el descriptor ya trae lo necesario para abrir por id.
    return {
      id: descriptor.sobreId,
      nombre: descriptor.etiqueta ?? 'Sobre',
      etiqueta: (descriptor.etiqueta ?? 'SOBRE').toUpperCase(),
      tipo: descriptor.tipo,
      precio: 0,
      cantidadCartas: this.cantidadCartasPorTipo(descriptor.tipo),
      esDiario: false,
      disponible: true,
    };
  }

  private cantidadCartasPorTipo(tipo: SobreInicialApertura['tipo']): number {
    return tipo === 'MARCA' ? 1 : tipo === 'CATEGORIA' ? 3 : CARTAS_SOBRE_DIARIO;
  }

  /**
   * Cómo se dibuja cada sobre (en el grid, la preview, el carrusel y el corte):
   * - General / diario: el envoltorio de Falta Una (sin categoría, nombre ni logo).
   * - Categoría: el icono de la categoría. Si el nombre no se reconoce, cae al genérico.
   * - Marca: variante clara con el logo (el del backend o el provisorio).
   */
  propsDeSobre(sobre: SobreItemUI | null): PropsSobre {
    switch (sobre?.tipo) {
      case 'CATEGORIA':
        return {
          categoria: categoriaDesdeNombre(sobre.categoria),
          variante: 'oscuro',
          nombre: null,
          logoUrl: null,
        };
      case 'MARCA': {
        const nombre = sobre.marca ?? sobre.nombre;
        return {
          categoria: null,
          variante: 'claro',
          nombre,
          logoUrl: sobre.logoUrl ?? LOGOS_MARCA_PROVISORIOS[claveMarca(nombre)] ?? null,
        };
      }
      default:
        return { categoria: null, variante: 'oscuro', nombre: null, logoUrl: null };
    }
  }

  protected readonly listaSobresUI = computed<SobreItemUI[]>(() => {
    const catalogo = this.sobresCatalogo();
    const diarios = this.sobresDiariosDisponibles();
    const inventario = this.sobresInventario();

    const items: SobreItemUI[] = [];

    // Los 2 sobres diarios gratuitos
    const totalDiarios = 2;
    for (let d = 1; d <= totalDiarios; d++) {
      const disponible = d <= diarios;
      items.push({
        id: `diario-${d}`,
        nombre: `Sobre Diario #${d}`,
        etiqueta: disponible ? 'GRATIS' : 'ABIERTO',
        tipo: 'GENERAL',
        precio: 0,
        cantidadCartas: CARTAS_SOBRE_DIARIO,
        esDiario: true,
        disponible,
        abierto: !disponible,
      });
    }

    // Sobres del inventario (todavía sin abrir)
    for (const inv of inventario) {
      if (!inv || inv.cantidad <= 0) continue;
      const sobreCatalogo = catalogo.find((s) => s.id === inv.sobreId);
      const tipo = (sobreCatalogo?.tipo ?? inv.tipo) as 'GENERAL' | 'CATEGORIA' | 'MARCA';
      const etiqueta = sobreCatalogo?.marca ?? sobreCatalogo?.categoria ?? inv.nombre;
      for (let i = 0; i < inv.cantidad; i++) {
        items.push({
          id: inv.sobreId,
          nombre: inv.nombre,
          etiqueta: etiqueta.toUpperCase(),
          tipo,
          precio: sobreCatalogo?.precio ?? 0,
          cantidadCartas:
            sobreCatalogo?.cantidadCartas ?? this.cantidadCartasPorTipo(tipo),
          esDiario: false,
          disponible: true,
          categoria: sobreCatalogo?.categoria ?? null,
          marca: sobreCatalogo?.marca ?? null,
          logoUrl: sobreCatalogo?.logoUrl ?? null,
        });
      }
    }

    // Sobres ya abiertos (solo informativos, no se pueden volver a elegir)
    const abiertos = this.sobresAbiertos().length > 0 ? this.sobresAbiertos() : this.abiertosLocal();
    for (const ab of abiertos) {
      const cat = catalogo.find((s) => s.id === ab.sobreId);
      const tipo = (cat?.tipo ?? ab.tipo) as 'GENERAL' | 'CATEGORIA' | 'MARCA';
      for (let i = 0; i < ab.cantidadAbiertos; i++) {
        items.push({
          id: ab.sobreId,
          nombre: ab.nombre,
          etiqueta: 'ABIERTO',
          tipo,
          precio: cat?.precio ?? 0,
          cantidadCartas: cat?.cantidadCartas ?? this.cantidadCartasPorTipo(tipo),
          esDiario: false,
          disponible: false,
          abierto: true,
          categoria: cat?.categoria ?? null,
          marca: cat?.marca ?? null,
          logoUrl: cat?.logoUrl ?? null,
        });
      }
    }

    return items;
  });

  // Los 8 sobres distribuidos circularmente e infinitos alrededor del centro
  protected readonly sobresCarrusel = computed(() => {
    const sel = this.sobreSeleccionado();
    if (!sel) return [];

    // Centro continuo considerando el arrastre en píxeles
    const center = this.indiceCarrusel() - this.dragOffset() / this.pxPorSobre();

    return [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
      let rel = (k - center) % 8;
      while (rel < -4) rel += 8;
      while (rel > 4) rel -= 8;

      return { k, rel, item: sel };
    });
  });

  // Cálculo de transformación 3D para el carrusel infinito
  obtenerTransformSobre(rel: number): string {
    const absRel = Math.abs(rel);
    // Desplazamiento expresado en "anchos de sobre" (continuo, sin salto en |rel| = 1).
    // El ancho real lo define la variable CSS --ancho-sobre, que escala con el viewport.
    const pasos = absRel <= 1 ? absRel * 0.46 : 0.46 + (absRel - 1) * 0.41;
    const x = (Math.sign(rel) * pasos).toFixed(4);
    const scale = Math.max(0.55, 1.08 - absRel * 0.15);
    const rotY = rel * -16;
    return `translateX(calc(${x} * var(--ancho-sobre, 13rem))) scale(${scale}) rotateY(${rotY}deg)`;
  }

  obtenerOpacidadSobre(rel: number): number {
    const absRel = Math.abs(rel);
    if (absRel >= 2.8) return 0;
    if (absRel > 1.8) return 0.35;
    if (absRel > 0.8) return 0.85;
    return 1;
  }

  obtenerZIndexSobre(rel: number): number {
    return Math.round(30 - Math.abs(rel) * 7);
  }

  /** Texto de la preview que describe qué trae el sobre; se adapta al tipo (general, categoría o marca). */
  descripcionSobre(sobre: SobreItemUI): string {
    const n = sobre.cantidadCartas;
    const cartas = n === 1 ? '1 carta aleatoria' : `${n} cartas aleatorias`;
    const base = `Este sobre contiene ${cartas}`;

    switch (sobre.tipo) {
      case 'MARCA':
        return sobre.marca ? `${base} de ${sobre.marca}` : base;
      case 'CATEGORIA':
        return sobre.categoria ? `${base} de la categoría ${sobre.categoria}` : base;
      default:
        return base;
    }
  }

  // Manejo de navegación entre fases
  iniciar(): void {
    this.abiertosLocal.set(this.leerAbiertosLocal());
    this.fase.set('seleccion');
    this.sobreSeleccionado.set(null);
    this.sobreCortado.set(false);
    this.cortando.set(false);
    this.errorApertura.set(null);
    this.cartasObtenidas.set([]);
    this.cartasUI.set([]);
    this.repetidas.set([]);
    this.indiceCartaActual.set(0);
    this.indiceCarrusel.set(0);
    this.dragOffset.set(0);
    this.enArrastre = false;
    this.punteroPresionado = false;
  }

  seleccionarSobre(sobre: SobreItemUI): void {
    if(!sobre.disponible) return; 
    this.sobreSeleccionado.set(sobre);
    this.fase.set('preview');
  }

  volverASeleccion(): void {
    this.fase.set('seleccion');
  }

  irACarrusel(): void {
    this.indiceCarrusel.set(0);
    this.dragOffset.set(0);
    this.enArrastre = false;
    this.punteroPresionado = false;
    this.fase.set('carrusel');
  }

  // Carrusel circular infinito: avanza o retrocede sin fin
  cambiarSobreCarrusel(direccion: number): void {
    this.indiceCarrusel.update((val) => val + direccion);
  }

  // Manejador explícito de clic sobre un sobre (robusto en desktop y mobile)
  alHacerClicSobre(rel: number, event?: Event): void {
    event?.stopPropagation();
    if (this.enArrastre || this.ignorarClic) return;
    this.elegirSobreDelCarrusel(rel);
  }

  elegirSobreDelCarrusel(rel: number): void {
    if (Math.abs(rel) > 0.4) {
      // Centra el sobre seleccionado
      this.cambiarSobreCarrusel(Math.round(rel));
      return;
    }

    // Selecciona el sobre central y pasa a cortar
    this.fase.set('corte');
    this.sobreCortado.set(false);
    this.cortando.set(false);
    this.errorApertura.set(null);
  }

  private punteroPresionado = false;

  // Arrastre e interacción del carrusel (requiere mantener presionado el botón)
  onPointerDownCarrusel(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.punteroPresionado = true;
    this.dragInicioX = event.clientX;
    this.enArrastre = false;
    this.dragOffset.set(0);
  }

  onPointerMoveCarrusel(event: PointerEvent): void {
    // Si no está presionado el botón del puntero, no arrastrar jamás
    if (!this.punteroPresionado) return;

    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      this.punteroPresionado = false;
      this.enArrastre = false;
      this.dragOffset.set(0);
      return;
    }

    const delta = event.clientX - this.dragInicioX;
    // Solo inicia captura de arrastre si el puntero se movió más de 6px mientras está presionado
    if (Math.abs(delta) > 6) {
      this.enArrastre = true;
      try {
        (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
      } catch { }
      this.dragOffset.set(delta);
    }
  }

  onPointerUpCarrusel(event: PointerEvent): void {
    if (!this.punteroPresionado) return;
    this.punteroPresionado = false;

    if (!this.enArrastre) return;

    try {
      (event.currentTarget as HTMLElement)?.releasePointerCapture?.(event.pointerId);
    } catch { }

    const delta = event.clientX - this.dragInicioX;
    const indice = this.indiceCarrusel();

    // Sobre más cercano al centro en el momento de soltar
    let destino = Math.round(indice - delta / this.pxPorSobre());

    // Un deslizamiento corto pero intencional (flick) avanza al menos un sobre
    if (destino === indice && Math.abs(delta) > 30) {
      destino = indice + (delta < 0 ? 1 : -1);
    }

    // Todo en el mismo tick y con transiciones activas: el carrusel se acomoda
    // suavemente desde donde lo soltaste hasta el sobre elegido.
    this.enArrastre = false;
    this.dragOffset.set(0);
    this.indiceCarrusel.set(destino);

    // Descarta el click que algunos navegadores disparan tras soltar
    this.ignorarClic = true;
    setTimeout(() => (this.ignorarClic = false), 50);
  }

  onPointerCancelCarrusel(): void {
    this.punteroPresionado = false;
    this.enArrastre = false;
    this.dragOffset.set(0);
  }

  // Interacción de corte por deslizamiento (swipe horizontal) o clic
  onPointerDownCorte(event: PointerEvent): void {
    this.corteInicioX = event.clientX;
    this.arrastrandoCorte = true;
    try {
      (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
    } catch { }
  }

  onPointerMoveCorte(event: PointerEvent): void {
    if (!this.arrastrandoCorte) return;
    const delta = event.clientX - this.corteInicioX;
    if (delta > 20) {
      this.arrastrandoCorte = false;
      this.ejecutarCorte();
    }
  }

  onPointerUpCorte(): void {
    this.arrastrandoCorte = false;
  }

  ejecutarCorte(): void {
    if (this.cortando() || this.sobreCortado() || this.cargandoApertura()) return;

    this.cortando.set(true);
    this.errorApertura.set(null);

    // Animación visual de rasgado: la mitad de arriba se desprende
    setTimeout(() => {
      this.sobreCortado.set(true);
      this.cortando.set(false);
      this.llamarApiApertura();
    }, 500);
  }

  private llamarApiApertura(): void {
    const sobre = this.sobreSeleccionado();
    const usuario = this.authService.usuarioActual();
    const usuarioId = usuario?.id ?? 1;

    this.cargandoApertura.set(true);

    const esDiario = sobre?.esDiario === true || String(sobre?.id).startsWith('diario');

    const llamada$ = esDiario
      ? this.sobresService.reclamarSobreDiario(usuarioId)
      : this.sobresService.abrirSobre(Number(sobre?.id), usuarioId);

    llamada$.subscribe({
      next: (resp) => {
        if (!esDiario && sobre) this.registrarAbierto(sobre);
        this.cargandoApertura.set(false);
        this.errorApertura.set(null);

        const cartasBackend = resp?.cartas ?? [];
        if (cartasBackend.length > 0) {
          this.mostrarCartasDesdeBackend(cartasBackend);
        } else {
          this.mostrarCartas(this.cantidadDeCartas(cartasBackend, sobre), sobre);
        }
        this.indiceCartaActual.set(0);
        this.aperturaRealizada.emit(resp);

        setTimeout(() => {
          this.fase.set('revelacion');
        }, 400);
      },
      error: (err) => {
        this.cargandoApertura.set(false);
        const mensaje =
          err?.error?.mensaje ||
          err?.error?.message ||
          err?.message ||
          'No se pudo abrir el sobre. Intentá nuevamente.';
        this.errorApertura.set(mensaje);
      },
    });
  }

  /**
   * Cantidad de cartas a mostrar. Prioridad:
   * 1. Lo que devolvió el backend (suma de `cantidad` de cada carta).
   * 2. La `cantidadCartas` del sobre (general 5, categoría 3, marca 1).
   */
  private cantidadDeCartas(
    delBackend: readonly CartaObtenidaRespuesta[],
    sobre: SobreItemUI | null,
  ): number {
    const total = delBackend.reduce((suma, c) => suma + Math.max(1, c.cantidad ?? 1), 0);
    if (total > 0) return total;
    return sobre && sobre.cantidadCartas > 0 ? sobre.cantidadCartas : CARTAS_SOBRE_DIARIO;
  }

  // Siguiente carta o finalizar
  avanzarOFinalizar(): void {
    const actual = this.indiceCartaActual();
    const total = this.cartasObtenidas().length;

    if (actual < total - 1) {
      // Reiniciamos la animación para la siguiente carta.
      this.animarCarta.set(false);
      this.indiceCartaActual.update((indice) => indice + 1);

      setTimeout(() => {
        this.animarCarta.set(true);
      }, 30);
    } else {
      this.cerrarFlujo();
    }
  }

  cerrarFlujo(): void {
    this.fase.set('cerrado');
    this.cerrar.emit();
  }

  private mostrarCartasDesdeBackend(cartasBackend: readonly CartaObtenidaRespuesta[]): void {
    const cartasUI: Carta[] = [];

    for (const cartaBackend of cartasBackend) {
      const cantidad = Math.max(1, cartaBackend.cantidad ?? 1);
      for (let i = 0; i < cantidad; i++) {
        cartasUI.push({
          id: `${cartaBackend.cartaId}-${i}`,
          cartaId: cartaBackend.cartaId,
          nombre: cartaBackend.nombre,
          imagenUrl: cartaBackend.imagenUrl ?? '',
          rareza: rarezaDesdeNombre(cartaBackend.rareza),
          categoria: categoriaCartaDesdeNombre(cartaBackend.categoria),
          atributoIzquierdo: cartaBackend.poder ?? 0,
          atributoDerecho: cartaBackend.costoMana ?? 0,
          obtenida: true,
        });
      }
    }

    this.cartasUI.set(cartasUI);
    this.marcarRepetidas(cartasUI);
    this.cartasObtenidas.set(
      cartasBackend.map((c) => ({
        cartaId: c.cartaId,
        nombre: c.nombre,
        cantidad: c.cantidad,
        imagenUrl: c.imagenUrl,
        rareza: c.rareza,
        poder: c.poder,
        costoMana: c.costoMana,
        categoria: c.categoria,
      })),
    );
  }

  /** Sortea las cartas del sobre y las deja listas para `app-carta`. */
  private mostrarCartas(cantidad: number, sobre: SobreItemUI | null): void {
    const elegidas = this.sortearCartas(cantidad, this.cartasPosibles(sobre));
    this.cartasUI.set(elegidas);
    this.marcarRepetidas(elegidas);
    // Se mantiene también la lista "simple": se usa para contar cartas y para el evento de salida.
    this.cartasObtenidas.set(
      elegidas.map((c, i) => ({ cartaId: i + 1, nombre: c.nombre, cantidad: 1, imagenUrl: c.imagenUrl })),
    );
  }

  /**
   * Marca como repetidas las cartas que ya habías obtenido (en sobres anteriores o en este mismo).
   * Provisorio: la lista de cartas vistas se guarda en el navegador (localStorage), por usuario.
   * Cuando el backend informe qué cartas tiene cada usuario, se reemplaza `leerCartasVistas`.
   */
  private marcarRepetidas(cartas: readonly Carta[]): void {
    const vistas = this.leerCartasVistas();
    const repetidas = cartas.map((c) => {
      const yaLaTenia = vistas.has(c.id);
      vistas.add(c.id);
      return yaLaTenia;
    });
    this.repetidas.set(repetidas);
    this.guardarCartasVistas(vistas);
  }

  private claveCartasVistas(): string {
    const usuarioId = this.authService.usuarioActual()?.id ?? 1;
    return `faltauna.cartas-vistas.${usuarioId}`;
  }

  private leerCartasVistas(): Set<string> {
    try {
      const guardado = localStorage.getItem(this.claveCartasVistas());
      return new Set<string>(guardado ? (JSON.parse(guardado) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  }

  private guardarCartasVistas(vistas: Set<string>): void {
    try {
      localStorage.setItem(this.claveCartasVistas(), JSON.stringify([...vistas]));
    } catch { }
  }

  /**
   * Cartas entre las que se sortea según el tipo de sobre:
   * - Categoría: solo las de esa categoría (si no hay ninguna, usa todas las del flujo).
   * - General y marca: todas las del flujo (el filtro por marca se agrega más adelante).
   */
  private cartasPosibles(sobre: SobreItemUI | null): readonly Carta[] {
    const base = CARTAS_DEL_FLUJO.length > 0 ? CARTAS_DEL_FLUJO : CARTAS_MOCK;

    if (sobre?.tipo === 'CATEGORIA') {
      const categoriaSobre = categoriaDesdeNombre(sobre.categoria);
      if (categoriaSobre) {
        const deLaCategoria = base.filter(
          (c) => c.categoria === CATEGORIA_SOBRE_A_CARTA[categoriaSobre],
        );
        if (deLaCategoria.length > 0) return deLaCategoria;
      }
    }

    return base;
  }

  /**
   * Elige `cantidad` cartas de `origen` al azar, sin repetir dentro del mismo sobre
   * (si piden más cartas que las disponibles, recién ahí se repiten).
   * Las comunes salen más seguido que las legendarias (ver `PESO_POR_RAREZA`).
   */
  private sortearCartas(cantidad: number, origen: readonly Carta[]): Carta[] {
    const resultado: Carta[] = [];
    let pool = [...origen];

    for (let i = 0; i < cantidad; i++) {
      if (pool.length === 0) pool = [...origen];

      const total = pool.reduce((suma, c) => suma + PESO_POR_RAREZA[c.rareza], 0);
      let tirada = Math.random() * total;
      let indice = pool.findIndex((c) => (tirada -= PESO_POR_RAREZA[c.rareza]) < 0);
      if (indice < 0) indice = pool.length - 1;

      const [carta] = pool.splice(indice, 1);
      resultado.push({ ...carta, obtenida: true }); // acaba de salir del sobre: se ve completa
    }

    return resultado;
  }

  /** Píxeles de arrastre que equivalen a desplazar un sobre (según el tamaño real en pantalla). */
  private pxPorSobre(): number {
    const sobre = this.escena()?.nativeElement.firstElementChild?.firstElementChild as HTMLElement | null;
    const ancho = sobre?.offsetWidth ?? 0;
    return ancho > 0 ? ancho * 0.43 : 150;
  }
}