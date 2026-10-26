import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import QRCode from 'qrcode';
import { Header } from '../../compartidos/componentes/header/header';
import { Confeti } from '../../compartidos/componentes/confeti/confeti';
import { CuponesService } from '../../servicios/cupones.service';
import { SonidoService } from '../../servicios/sonido.service';
import {
  CategoriaCupon,
  CuponDescuento,
  EstadoCupon,
} from '../../modelos/cupon.model';

import urlIconoGastro from '../../compartidos/SVGs/Icon_GastroInv.svg';
import urlIconoDeco from '../../compartidos/SVGs/Icon_DecoInv.svg';
import urlIconoCosme from '../../compartidos/SVGs/Icon_CosmeInv.svg';
import urlIconoIndumentaria from '../../compartidos/SVGs/Icon_IndumentariaInv.svg';
import urlIconoEntretenimiento from '../../compartidos/SVGs/Icon_EntretenimientoInv.svg';
import urlIconoMusica from '../../compartidos/SVGs/Icon_MusicaINV.svg';
import urlIconoTecno from '../../compartidos/SVGs/Icon_TecnoInv.svg';

interface FiltroCategoria {
  readonly id: CategoriaCupon;
  readonly nombre: string;
  readonly urlIcono: string;
}

/**
 * Pantalla de cupones del usuario.
 * Cada cupón disponible muestra un QR que lleva a la página de la marca con el descuento.
 */
@Component({
  selector: 'app-usuario-cupones',
  standalone: true,
  imports: [RouterLink, DatePipe, Header, Confeti],
  templateUrl: './usuario-cupones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cerrarCupon(); cerrarMenu()',
    '(document:click)': 'cerrarMenu()',
  },
  styles: `
    /* Sello postal: borde ondulado fino (perforaciones) alrededor de un fondo crema. */
    .sello {
      --perf: 3.5px;
      --linea: 2px;
      /* Sobre fondo oscuro: la línea del sello es crema y las perforaciones dejan ver el fondo. */
      --tinta: var(--crema);
      --papel: var(--fondo);
      position: relative;
      background-color: var(--tinta);
      background-image:
        radial-gradient(circle at 6px 0, var(--papel) var(--perf), transparent calc(var(--perf) + 0.5px)),
        radial-gradient(circle at 6px 8px, var(--papel) var(--perf), transparent calc(var(--perf) + 0.5px)),
        radial-gradient(circle at 0 6px, var(--papel) var(--perf), transparent calc(var(--perf) + 0.5px)),
        radial-gradient(circle at 8px 6px, var(--papel) var(--perf), transparent calc(var(--perf) + 0.5px));
      background-size: 12px 8px, 12px 8px, 8px 12px, 8px 12px;
      background-position: 0 0, 0 100%, 0 0, 100% 0;
      background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
    }

    /* Hoja crema interior: deja a la vista solo una línea fina de tinta en el borde. */
    .sello__hoja {
      position: absolute;
      inset: var(--linea);
      background-color: var(--papel);
      background-image:
        radial-gradient(circle at calc(6px - var(--linea)) calc(0px - var(--linea)), transparent var(--perf), var(--tinta) var(--perf), var(--tinta) calc(var(--perf) + var(--linea)), transparent calc(var(--perf) + var(--linea) + 0.5px)),
        radial-gradient(circle at calc(6px - var(--linea)) calc(8px + var(--linea)), transparent var(--perf), var(--tinta) var(--perf), var(--tinta) calc(var(--perf) + var(--linea)), transparent calc(var(--perf) + var(--linea) + 0.5px)),
        radial-gradient(circle at calc(0px - var(--linea)) calc(6px - var(--linea)), transparent var(--perf), var(--tinta) var(--perf), var(--tinta) calc(var(--perf) + var(--linea)), transparent calc(var(--perf) + var(--linea) + 0.5px)),
        radial-gradient(circle at calc(8px + var(--linea)) calc(6px - var(--linea)), transparent var(--perf), var(--tinta) var(--perf), var(--tinta) calc(var(--perf) + var(--linea)), transparent calc(var(--perf) + var(--linea) + 0.5px));
      background-size: 12px 8px, 12px 8px, 8px 12px, 8px 12px;
      background-position: 0 0, 0 100%, 0 0, 100% 0;
      background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
    }

    .titulo-cupones {
      color: var(--crema);
      text-shadow: 3px 3px 0 color-mix(in srgb, var(--color-verde-jugador) 55%, var(--fondo));
    }

    /* Tipografía Rockstone: copiar el archivo de la fuente a public/fuentes/ (ver README del cambio). */
    @font-face {
      font-family: 'Rockstone';
      src:
        url('/fuentes/Rockstone.woff2') format('woff2'),
        url('/fuentes/Rockstone.otf') format('opentype'),
        url('/fuentes/Rockstone.ttf') format('truetype');
      font-display: swap;
    }

    /* Rockstone en toda la vista (títulos, botones, buscador, modal). */
    .pagina,
    .pagina * {
      font-family: 'Rockstone', 'Russo One', system-ui, sans-serif !important;
      font-weight: 400 !important;
    }

    .pagina {
      --fondo: var(--color-teal-profundo);
      --crema: var(--color-amarillo-logo);
      background-color: var(--fondo);
      color: var(--crema);
    }

    .vista-cupones {
      --r-disco: 11.5rem;
      --visible: 12.5rem;
      --r-icono: 10rem;
      --tam-icono: 3rem;
      --ang-activo: -66deg;
    }

    @media (max-width: 639px) {
      .vista-cupones {
        --r-disco: 6.6rem;
        --visible: 7.2rem;
        --r-icono: 5.6rem;
        --tam-icono: 1.8rem;
      }
    }

    .disco-marco {
      width: var(--visible);
      /* Está por encima del título solo para que se vea el disco: no debe tapar sus clicks. */
      pointer-events: none;
    }

    /* En pantallas angostas la página es muy alta: el disco queda arriba, con altura propia. */
    @media (max-width: 639px) {
      .disco-marco {
        bottom: auto;
        height: 17rem;
      }
    }

    /* Punto fijo desde el que se cuelgan los íconos: el centro del disco. */
    .disco-eje {
      position: absolute;
      top: 50%;
      left: calc(var(--visible) - var(--r-disco));
      width: 0;
      height: 0;
    }

    .disco-icono {
      --ang: 0deg;
      position: absolute;
      left: 0;
      top: 0;
      width: var(--tam-icono);
      height: var(--tam-icono);
      margin: calc(var(--tam-icono) / -2) 0 0 calc(var(--tam-icono) / -2);
      /* Orbitan alrededor del centro del disco, pero se mantienen casi derechos. */
      transform: rotate(var(--ang)) translateX(var(--r-icono)) rotate(calc(var(--ang) * -1 + var(--inclina, 0deg)));
      transition:
        transform 0.85s cubic-bezier(0.5, 0, 0.2, 1),
        opacity 0.5s ease,
        filter 0.3s ease;
    }

    .disco-icono {
      pointer-events: auto;
    }

    /* Glifo de la categoría: sin fondo, pintado en crema a partir del SVG. */
    .disco-glifo {
      width: 100%;
      height: 100%;
      background-color: var(--crema);
      -webkit-mask: var(--glifo) center / contain no-repeat;
      mask: var(--glifo) center / contain no-repeat;
      transition: background-color 0.3s ease, transform 0.3s ease;
    }

    .disco-icono:hover .disco-glifo {
      transform: scale(1.12);
    }

    /* Categoría elegida: se ilumina en verde y late una vez al activarse. */
    .disco-icono--activo {
      filter: drop-shadow(0 0 0.6rem color-mix(in srgb, var(--color-verde-jugador) 85%, transparent));
      animation: disco-latido 0.9s ease-out;
    }

    .disco-icono--activo .disco-glifo {
      background-color: var(--color-verde-jugador);
      transform: scale(1.18);
    }

    @keyframes disco-latido {
      0% { filter: drop-shadow(0 0 0 transparent); }
      60% { filter: drop-shadow(0 0 1.4rem var(--color-verde-jugador)) drop-shadow(0 0 0.5rem var(--color-verde-jugador)); }
      100% { filter: drop-shadow(0 0 0.6rem color-mix(in srgb, var(--color-verde-jugador) 85%, transparent)); }
    }

    /* Cupón: al pasar el mouse o enfocarlo se ilumina. */
    .sello:hover,
    .sello:focus-visible {
      filter: brightness(1.07) saturate(1.15)
        drop-shadow(0 0 0.7rem color-mix(in srgb, var(--color-verde-jugador) 85%, transparent));
    }

    .disco-icono--lejos {
      opacity: 0;
      pointer-events: none;
    }

    /* Triángulo fijo que marca la categoría elegida (no gira con el disco). */
    .disco-puntero {
      position: absolute;
      left: 0;
      top: 0;
      width: 0.8rem;
      height: 1.1rem;
      margin: -0.55rem 0 0 -0.4rem;
      background: var(--color-verde-jugador);
      clip-path: polygon(0 0, 100% 50%, 0 100%);
      transform: translate(
        calc(cos(var(--ang-activo)) * var(--r-icono) - var(--tam-icono) / 2 - 1rem),
        calc(sin(var(--ang-activo)) * var(--r-icono))
      );
    }

    @media (prefers-reduced-motion: reduce) {
      .disco-icono,
      .disco-glifo {
        transition: none;
        animation: none;
      }
    }

    /* Sello: las bandas del arte se mecen apenas al pasar el mouse. */
    .sello__arte {
      transition: transform 0.6s ease;
    }

    .sello:hover .sello__arte,
    .sello:focus-visible .sello__arte {
      transform: scale(1.06);
    }

    @media (prefers-reduced-motion: reduce) {
      .sello__arte {
        transition: none;
      }
    }
  `,
})
export class UsuarioCupones {
  private readonly cuponesService = inject(CuponesService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly sonido = inject(SonidoService);

  /** Sonido (mp3) que suena al tocar un cupón para canjearlo. Reemplazá el archivo para cambiarlo. */
  private readonly sonidoCanje = 'sonidos/canje.mp3';

  protected readonly categorias: readonly FiltroCategoria[] = [
    { id: 'gastronomia', nombre: 'Gastronomía', urlIcono: urlIconoGastro },
    { id: 'deco', nombre: 'Deco', urlIcono: urlIconoDeco },
    {
      id: 'indumentaria',
      nombre: 'Indumentaria',
      urlIcono: urlIconoIndumentaria,
    },
    { id: 'tecnologia', nombre: 'Tecnología', urlIcono: urlIconoTecno },
    { id: 'cosmetica', nombre: 'Cosmética', urlIcono: urlIconoCosme },
    { id: 'musica', nombre: 'Música', urlIcono: urlIconoMusica },
    {
      id: 'entretenimiento',
      nombre: 'Entretenimiento',
      urlIcono: urlIconoEntretenimiento,
    },
  ];

  private readonly confeti = viewChild(Confeti);

  protected readonly cupones = signal<CuponDescuento[]>([]);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categoriaActiva = signal<CategoriaCupon>('gastronomia');

  /** Texto del buscador. */
  protected readonly busqueda = signal('');

  /** Estado elegido en el filtro; null significa todos. */
  protected readonly estadoActivo = signal<EstadoCupon | null>(null);
  protected readonly estados: readonly EstadoCupon[] = [
    'Disponible',
    'Usado',
    'Vencido',
  ];

  protected readonly menuAbierto = signal(false);

  protected readonly hayFiltros = computed(
    () => this.busqueda().trim() !== '' || this.estadoActivo() !== null,
  );

  protected readonly cuponSeleccionado = signal<CuponDescuento | null>(null);
  protected readonly urlQr = signal<string | null>(null);
  protected readonly tokenQr = signal<string | null>(null);
  protected readonly qrCargando = signal(false);
  protected readonly qrError = signal(false);

  protected readonly cuponesFiltrados = computed(() => {
    const categoria = this.categoriaActiva();
    const estado = this.estadoActivo();
    const texto = this.busqueda().trim().toLowerCase();

    return this.cupones().filter((c) => {
      if (c.categoria !== categoria) {
        return false;
      }

      if (estado !== null && c.estado !== estado) {
        return false;
      }

      if (texto !== '') {
        const marca = (c.marca || '').toLowerCase();
        const titulo = (c.titulo || '').toLowerCase();
        const descripcion = (c.descripcion || '').toLowerCase();
        const codigo = (c.codigo || '').toLowerCase();
        const detalles = (c.detalles || '').toLowerCase();

        const coincide =
          marca.includes(texto) ||
          titulo.includes(texto) ||
          descripcion.includes(texto) ||
          codigo.includes(texto) ||
          detalles.includes(texto);

        if (!coincide) {
          return false;
        }
      }

      return true;
    });
  });

  /** Categorías con cupones que coinciden con los filtros actuales. */
  protected readonly categoriasConResultados = computed(() => {
    const estado = this.estadoActivo();
    const texto = this.busqueda().trim().toLowerCase();

    if (!this.hayFiltros()) {
      return new Set<CategoriaCupon>();
    }

    const encontradas = new Set<CategoriaCupon>();

    for (const c of this.cupones()) {
      if (estado !== null && c.estado !== estado) {
        continue;
      }

      if (texto !== '') {
        const marca = (c.marca || '').toLowerCase();
        const titulo = (c.titulo || '').toLowerCase();
        const descripcion = (c.descripcion || '').toLowerCase();
        const codigo = (c.codigo || '').toLowerCase();
        const detalles = (c.detalles || '').toLowerCase();

        const coincide =
          marca.includes(texto) ||
          titulo.includes(texto) ||
          descripcion.includes(texto) ||
          codigo.includes(texto) ||
          detalles.includes(texto);

        if (!coincide) {
          continue;
        }
      }

      encontradas.add(c.categoria);
    }

    return encontradas;
  });

  /** Cupones disponibles (los que todavía se pueden usar). */
  protected readonly cuponesActivos = computed(
    () => this.cupones().filter((c) => c.estado === 'Disponible').length,
  );

  /** Solo un cupón disponible tiene QR para mostrar. */
  protected readonly cuponUtilizable = computed(
    () => this.cuponSeleccionado()?.estado === 'Disponible',
  );

  constructor() {
    const destruir = inject(DestroyRef);

    destruir.onDestroy(() => this.liberarQr());

    // Cada cambio de categoría (click o URL) hace girar el disco.
    effect(() => {
      const indice = this.indiceActivo();
      untracked(() => this.girarHasta(indice));
    });

    this.sonido.precargar(this.sonidoCanje);
    this.escucharCategoriaDesdeUrl(destruir);
    this.cargarCupones();

    // Espera un instante después de escribir antes de consultar de nuevo.
    toObservable(this.busqueda)
      .pipe(
        skip(1),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(destruir),
      )
      .subscribe(() => {
        this.cargarCupones();
      });
  }

  /**
   * Preselecciona la categoría indicada por ?categoria=.
   */
  private escucharCategoriaDesdeUrl(destruir: DestroyRef): void {
    this.ruta.queryParamMap
      .pipe(takeUntilDestroyed(destruir))
      .subscribe((params) => {
        const categoria = params.get('categoria');

        if (categoria && this.categorias.some((c) => c.id === categoria)) {
          this.categoriaActiva.set(categoria as CategoriaCupon);
        }
      });
  }

  protected cargarCupones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.cuponesService
      .obtenerMisCupones({
        buscar: this.busqueda(),
        estado: this.estadoActivo(),
      })
      .subscribe({
        next: (cupones) => {
          this.cupones.set(cupones);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(
            'No pudimos cargar tus cupones. Probá de nuevo en un rato.',
          );
          this.cargando.set(false);
        },
      });
  }

  /** Texto de la franja inferior del sello: "20% OFF". */
  protected etiquetaDescuento(cupon: CuponDescuento): string {
    const porcentaje =
      cupon.porcentajeDescuento ??
      Number(
        /(\d{1,3})\s*%/.exec(
          `${cupon.titulo} ${cupon.detalles} ${cupon.descripcion}`,
        )?.[1],
      );

    return Number.isFinite(porcentaje) && porcentaje > 0
      ? `${porcentaje}% OFF`
      : 'Ver cupón';
  }

  /** Grados entre un ícono y el siguiente sobre el borde del disco. */
  private readonly pasoGrados = 22;
  /** Posición (grados desde el eje horizontal) donde queda la categoría elegida. */
  private readonly anguloActivo = -66;
  /** Cuántas categorías se ven por encima de la elegida antes de que den la vuelta por atrás. */
  private readonly lugaresArriba = 0;

  protected readonly indiceActivo = computed(() =>
    Math.max(
      0,
      this.categorias.findIndex((c) => c.id === this.categoriaActiva()),
    ),
  );

  /**
   * Ángulo acumulado de cada ícono. No se reinicia nunca: una categoría que sale por
   * arriba sigue girando por detrás del disco y reaparece abajo, como en espiral.
   */
  protected readonly angulos = signal<number[]>(this.angulosPara(0));

  private indicePrevio = 0;

  /** Lugar de un ícono respecto del elegido, en el ciclo de categorías. */
  private lugar(indice: number, activo: number): number {
    const n = this.categorias.length;
    return (
      ((((indice - activo + this.lugaresArriba) % n) + n) % n) -
      this.lugaresArriba
    );
  }

  private angulosPara(activo: number): number[] {
    return this.categorias.map(
      (_, i) => this.anguloActivo + this.lugar(i, activo) * this.pasoGrados,
    );
  }

  /** Gira el disco por el camino más corto hasta dejar `nuevo` en la posición activa. */
  private girarHasta(nuevo: number): void {
    const previo = this.indicePrevio;

    if (nuevo === previo) {
      return;
    }

    const n = this.categorias.length;
    let pasos = (((nuevo - previo) % n) + n) % n;

    if (pasos > n / 2) {
      pasos -= n;
    }

    this.angulos.update((actuales) =>
      actuales.map((angulo, i) => {
        const salto = this.lugar(i, nuevo) - this.lugar(i, previo);
        let giro = salto * this.pasoGrados;

        // El ícono que da la vuelta por atrás recorre el resto de la circunferencia.
        if (salto === -pasos + n) {
          giro -= 360;
        } else if (salto === -pasos - n) {
          giro += 360;
        }

        return angulo + giro;
      }),
    );

    this.indicePrevio = nuevo;
  }

  /** Solo se ven los íconos que están sobre la parte visible del disco. */
  protected fueraDeVista(indice: number): boolean {
    const normalizado = ((((this.angulos()[indice] + 180) % 360) + 360) % 360) - 180;
    return normalizado < -80 || normalizado > 80;
  }

  protected elegirCategoria(id: CategoriaCupon): void {
    this.categoriaActiva.set(id);
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected escribirBusqueda(texto: string): void {
    this.busqueda.set(texto);
  }

  /** Volver a tocar el estado activo lo desactiva. */
  protected elegirEstado(estado: EstadoCupon): void {
    this.estadoActivo.set(
      this.estadoActivo() === estado ? null : estado,
    );
    this.menuAbierto.set(false);
    this.cargarCupones();
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.estadoActivo.set(null);
    this.menuAbierto.set(false);
    this.cargarCupones();
  }

  protected abrirCupon(cupon: CuponDescuento, evento?: MouseEvent): void {
    this.confeti()?.lanzarDesdeEvento(evento);

    // Solo los cupones que todavía se pueden canjear hacen sonar el mp3.
    if (cupon.estado === 'Disponible') {
      this.sonido.reproducir(this.sonidoCanje);
    }

    this.liberarQr();
    this.cuponSeleccionado.set(cupon);
    this.qrError.set(false);

    if (cupon.estado !== 'Disponible') {
      return;
    }

    this.qrCargando.set(true);

    // Con enlace de la marca, el QR se genera acá y lleva directo a la página del descuento.
    if (cupon.enlace) {
      this.generarQrLocal(cupon, cupon.enlace);
      return;
    }

    this.cuponesService.obtenerQr(cupon.id).subscribe({
      next: ({ imagen, token }) => {
        // Si se cerró o cambió el cupón, se descarta la respuesta.
        if (this.cuponSeleccionado()?.id !== cupon.id) {
          return;
        }

        this.tokenQr.set(token);
        this.urlQr.set(URL.createObjectURL(imagen));
        this.qrCargando.set(false);
      },
      // Si el backend no entrega el QR, se genera uno acá con el código del cupón.
      error: () => this.generarQrLocal(cupon, cupon.codigo),
    });
  }

  /** Dibuja el QR en el navegador; así todos los cupones tienen QR aunque falle el backend. */
  private generarQrLocal(cupon: CuponDescuento, contenido: string): void {
    QRCode.toDataURL(contenido, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl: string) => {
        if (this.cuponSeleccionado()?.id !== cupon.id) {
          return;
        }

        this.urlQr.set(dataUrl);
        this.qrCargando.set(false);
      })
      .catch(() => {
        this.qrError.set(true);
        this.qrCargando.set(false);
      });
  }

  protected cerrarCupon(): void {
    this.cuponSeleccionado.set(null);
    this.qrCargando.set(false);
    this.liberarQr();
  }

  protected descargarQr(): void {
    const url = this.urlQr();
    const cupon = this.cuponSeleccionado();

    if (!url || !cupon) {
      return;
    }

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `cupon-${cupon.marca
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${cupon.codigo}.png`;
    enlace.click();
  }

  private liberarQr(): void {
    const url = this.urlQr();

    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }

    this.urlQr.set(null);
    this.tokenQr.set(null);
  }
}