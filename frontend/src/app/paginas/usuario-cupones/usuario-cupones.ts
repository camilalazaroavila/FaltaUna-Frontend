import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import QRCode from 'qrcode';
import { Header } from '@compartidos/componentes/layout/header/header';
import { Confeti } from '@compartidos/componentes/confeti/confeti';
import { CuponesService } from '@servicios/cupones.service';
import { SonidoService } from '@servicios/sonido.service';
import { CategoriaCupon, CuponDescuento, EstadoCupon } from '@modelos/cupon.model';

import urlIconoGastro from '@svgs/Icon_GastroInv.svg';
import urlIconoDeco from '@svgs/Icon_DecoInv.svg';
import urlIconoCosme from '@svgs/Icon_CosmeInv.svg';
import urlIconoIndumentaria from '@svgs/Icon_IndumentariaInv.svg';
import urlIconoEntretenimiento from '@svgs/Icon_EntretenimientoInv.svg';
import urlIconoMusica from '@svgs/Icon_MusicaINV.svg';
import urlIconoTecno from '@svgs/Icon_TecnoInv.svg';

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

    /* Columna de categorías: íconos en cuadrados crema, uno debajo del otro. */
    .vista-cupones {
      --visible: 6.25rem;
      --tam-icono: 2.75rem;
      --sep-icono: 0.65rem;
    }

    @media (max-width: 639px) {
      .vista-cupones {
        --visible: 4.25rem;
        --tam-icono: 2.25rem;
        --sep-icono: 0.5rem;
      }
    }

    .rail {
      position: absolute;
      left: 0;
      top: 8rem;
      z-index: 35;
      width: var(--visible);
    }

    .rail__lista {
      display: flex;
      flex-direction: column;
      gap: var(--sep-icono);
      margin: 0;
      padding: 0 0 0 calc(var(--visible) - var(--tam-icono) - 0.4rem);
      list-style: none;
    }

    /* Triángulo verde: se desliza hasta la categoría elegida. */
    .rail__puntero {
      --i: 0;
      position: absolute;
      left: calc(var(--visible) - var(--tam-icono) - 1.6rem);
      top: calc(var(--tam-icono) / 2 - 0.55rem);
      width: 0.85rem;
      height: 1.1rem;
      background: var(--color-verde-jugador);
      clip-path: polygon(0 0, 100% 50%, 0 100%);
      filter: drop-shadow(0 0 0.35rem var(--color-verde-jugador));
      transform: translateY(calc(var(--i) * (var(--tam-icono) + var(--sep-icono))));
      transition: transform 0.45s cubic-bezier(0.5, 0, 0.2, 1);
    }

    .rail__item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--tam-icono);
      height: var(--tam-icono);
      border-radius: 0.75rem;
      background-color: var(--crema);
      cursor: pointer;
      transition:
        transform 0.28s cubic-bezier(0.3, 0.7, 0.2, 1),
        box-shadow 0.28s ease,
        background-color 0.28s ease,
        filter 0.28s ease;
    }

    .rail__item img {
      width: 60%;
      height: 60%;
      object-fit: contain;
      transition: transform 0.28s cubic-bezier(0.3, 0.7, 0.2, 1);
    }

    /* Hover / foco: se corre un poco hacia el contenido y se ilumina con un halo crema. */
    .rail__item:hover,
    .rail__item:focus-visible {
      transform: translateX(4px) scale(1.07);
      filter: brightness(1.06);
      box-shadow:
        0 0 0 2px color-mix(in srgb, var(--crema) 70%, transparent),
        0 0 1rem 0.1rem color-mix(in srgb, var(--crema) 55%, transparent);
    }

    .rail__item:hover img,
    .rail__item:focus-visible img {
      transform: scale(1.08);
    }

    /* Categoría elegida: queda iluminada en verde y late una vez al activarse. */
    .rail__item--activo,
    .rail__item--activo:hover,
    .rail__item--activo:focus-visible {
      transform: translateX(4px) scale(1.07);
      background-color: color-mix(in srgb, var(--color-verde-jugador) 38%, var(--crema));
      box-shadow:
        0 0 0 2px var(--color-verde-jugador),
        0 0 1.3rem 0.25rem color-mix(in srgb, var(--color-verde-jugador) 70%, transparent);
      animation: rail-latido 0.9s ease-out;
    }

    @keyframes rail-latido {
      0% {
        box-shadow: 0 0 0 2px var(--color-verde-jugador), 0 0 0 0 color-mix(in srgb, var(--color-verde-jugador) 80%, transparent);
      }
      60% {
        box-shadow: 0 0 0 2px var(--color-verde-jugador), 0 0 2.2rem 0.6rem color-mix(in srgb, var(--color-verde-jugador) 80%, transparent);
      }
      100% {
        box-shadow: 0 0 0 2px var(--color-verde-jugador), 0 0 1.3rem 0.25rem color-mix(in srgb, var(--color-verde-jugador) 70%, transparent);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .rail__puntero,
      .rail__item,
      .rail__item img {
        transition: none;
        animation: none;
      }

      .rail__item:hover,
      .rail__item:focus-visible,
      .rail__item--activo {
        transform: none;
        animation: none;
      }
    }

    /* Cupón: al pasar el mouse o enfocarlo se ilumina. */
    .sello:hover,
    .sello:focus-visible {
      filter: brightness(1.07) saturate(1.15)
        drop-shadow(0 0 0.7rem color-mix(in srgb, var(--color-verde-jugador) 85%, transparent));
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

  /** Posición de la categoría elegida en la columna: mueve el triángulo verde. */
  protected readonly indiceActivo = computed(() =>
    Math.max(
      0,
      this.categorias.findIndex((c) => c.id === this.categoriaActiva()),
    ),
  );

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