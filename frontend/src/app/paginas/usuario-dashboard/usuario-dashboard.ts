import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SobresService, type SobreInventarioUsuario } from '@servicios/sobres.service';
import { AuthService } from '@servicios/auth.service';
import { BotonNavegacionCircular } from '@compartidos/componentes/controles/boton-navegacion-circular/boton-navegacion-circular';
import { FlujoAperturaSobres } from '@compartidos/componentes/cartas/flujo-apertura-sobres/flujo-apertura-sobres';
import { Header } from '@compartidos/componentes/layout/header/header';
import { SobreMarca } from '@compartidos/componentes/cartas/sobre-marca/sobre-marca';
import { SobreRespuesta } from '@modelos/sobre.model';

import urlSobreIzquierda from '@svgs/PaqueteHuhDosColores.svg';
import urlSobreCentro from '@svgs/Paquete1.svg';
import urlSobreDerecha from '@svgs/Paquete2.svg';
import urlIconPelea from '@svgs/IconPelea.svg';

import urlIconoMisCartas from '@svgs/Icon_misCartas.svg';
import urlIconoAlbum from '@svgs/Icon_Album.svg';
import urlIconoIntercambios from '@svgs/Icon_Intercambio.svg';
import urlIconoQr from '@svgs/Icon_Qr.svg';
import urlIconoDescuento from '@svgs/Icon_Descuento.svg';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Confeti } from '@compartidos/componentes/confeti/confeti';
import {
  BarajaService,
  NOMBRES_MAZOS_BIENVENIDA,
  resolverImagenCarta,
  resolverNombreMazoInicial,
} from '@servicios/baraja.service';
import { SonidoService, SONIDOS_PARTIDA } from '@servicios/sonido.service';
import { IntercambioService } from '@servicios/intercambio.service';
import type { MazoApi } from '@modelos/mazo.model';

export interface DestinoNavegacion {
  readonly id: string;
  readonly nombre: string;
  readonly ruta?: string;
  readonly urlIcono?: string;
  readonly icono?: string;
  readonly deshabilitado?: boolean;
}

export interface SobreOpcion {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly cantidadCartas: number;
  readonly urlImagen: string;
  readonly disponible: boolean;
  readonly tipo: 'gratis' | 'tematico' | 'misterio';
}

const MAZOS_BIENVENIDA_RESPALDO: readonly MazoApi[] = [
  {
    id: 1,
    nombre: NOMBRES_MAZOS_BIENVENIDA[0],
    completo: true,
    cartas: [
      {
        cartaId: 12,
        nombre: 'Golden Run',
        poder: 9,
        costoCupon: 6,
        rarezaId: 4,
        rareza: 'Legendaria',
        rarezaOrden: 4,
        imagenUrl: resolverImagenCarta('/cartas/aura_golden_run.png', 'Golden Run'),
      },
      {
        cartaId: 10,
        nombre: 'Aura Urban Pack',
        poder: 6,
        costoCupon: 4,
        rarezaId: 3,
        rareza: 'Épica',
        rarezaOrden: 3,
        imagenUrl: resolverImagenCarta('/cartas/aura_urban_pack.png', 'Aura Urban Pack'),
      },
      {
        cartaId: 34,
        nombre: 'Royal de Chocolate y Rosa',
        poder: 8,
        costoCupon: 5,
        rarezaId: 3,
        rareza: 'Épica',
        rarezaOrden: 3,
        imagenUrl: resolverImagenCarta(
          '/cartas/dulce_atelier_royal_chocolate.png',
          'Royal de Chocolate y Rosa',
        ),
      },
    ],
  },
  {
    id: 2,
    nombre: NOMBRES_MAZOS_BIENVENIDA[1],
    completo: true,
    cartas: [
      {
        cartaId: 24,
        nombre: 'Harmony Sound DJ Controller',
        poder: 10,
        costoCupon: 6,
        rarezaId: 4,
        rareza: 'Legendaria',
        rarezaOrden: 4,
        imagenUrl: resolverImagenCarta(
          '/cartas/harmony_sound_dj_controller.png',
          'Harmony Sound DJ Controller',
        ),
      },
      {
        cartaId: 11,
        nombre: 'Aura Weekender',
        poder: 8,
        costoCupon: 5,
        rarezaId: 3,
        rareza: 'Épica',
        rarezaOrden: 3,
        imagenUrl: resolverImagenCarta('/cartas/aura_weekender.png', 'Aura Weekender'),
      },
      {
        cartaId: 35,
        nombre: 'Tarta Mousse Frutos del Bosque',
        poder: 6,
        costoCupon: 4,
        rarezaId: 3,
        rareza: 'Épica',
        rarezaOrden: 3,
        imagenUrl: resolverImagenCarta(
          '/cartas/dulce_atelier_tarta_mousse.png',
          'Tarta Mousse Frutos del Bosque',
        ),
      },
    ],
  },
  {
    id: 3,
    nombre: NOMBRES_MAZOS_BIENVENIDA[2],
    completo: true,
    cartas: [
      {
        cartaId: 36,
        nombre: 'Croquembouche Imperial de Caramelo',
        poder: 10,
        costoCupon: 6,
        rarezaId: 4,
        rareza: 'Legendaria',
        rarezaOrden: 4,
        imagenUrl: resolverImagenCarta(
          '/cartas/dulce_atelier_croquembouche.png',
          'Croquembouche Imperial de Caramelo',
        ),
      },
      {
        cartaId: 25,
        nombre: 'Harmony Sound Retro Mic',
        poder: 7,
        costoCupon: 4,
        rarezaId: 3,
        rareza: 'Épica',
        rarezaOrden: 3,
        imagenUrl: resolverImagenCarta(
          '/cartas/harmony_sound_retro_mic.png',
          'Harmony Sound Retro Mic',
        ),
      },
      {
        cartaId: 15,
        nombre: 'Aura High-Top Blanco',
        poder: 5,
        costoCupon: 3,
        rarezaId: 2,
        rareza: 'Rara',
        rarezaOrden: 2,
        imagenUrl: resolverImagenCarta('/cartas/aura_high_top_blanco.png', 'Aura High-Top Blanco'),
      },
    ],
  },
];

@Component({
  selector: 'app-usuario-dashboard',
  imports: [
    Header,
    BotonNavegacionCircular,
    FlujoAperturaSobres,
    SobreMarca,
    Boton,
    Confeti,
  ],
  templateUrl: './usuario-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioDashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly sobresService = inject(SobresService);
  private readonly authService = inject(AuthService);
  private readonly intercambioService = inject(IntercambioService);
  private readonly barajaService = inject(BarajaService, { optional: true });
  private readonly sonidoService = inject(SonidoService, { optional: true });

  readonly confeti = viewChild(Confeti);

  protected readonly sobresCatalogo = signal<readonly SobreRespuesta[]>([]);
  protected readonly sobresInventario = signal<readonly SobreInventarioUsuario[]>([]);
  protected readonly tieneNovedadIntercambios = this.intercambioService.tieneNovedadDashboardSignal;
  protected readonly modalBienvenidaMazosVisible = signal<boolean>(false);
  protected readonly mazosBienvenida = signal<readonly MazoApi[]>([]);

  protected readonly urlIconPelea = urlIconPelea;

  protected readonly destinos: readonly DestinoNavegacion[] = [
    { id: 'cartas', nombre: 'Mis cartas', ruta: '/usuario/mis-cartas', urlIcono: urlIconoMisCartas },
    { id: 'misiones', nombre: 'Misiones', ruta: '/usuario/misiones', icono: 'phosphorTrophyFill' },
    { id: 'album', nombre: 'Álbumes', ruta: '/usuario/albumes', urlIcono: urlIconoAlbum },
    { id: 'intercambios', nombre: 'Intercambio', ruta: '/usuario/intercambio', urlIcono: urlIconoIntercambios },
    { id: 'qr', nombre: 'Canje', urlIcono: urlIconoQr, deshabilitado: true },
    { id: 'cupones', nombre: 'Mis cupones', ruta: '/usuario/cupones', urlIcono: urlIconoDescuento },
  ];

  protected readonly opcionesSobres: readonly SobreOpcion[] = [
    {
      id: 'sobre-diario',
      titulo: 'Sobre Diario Gratuito',
      descripcion: 'Abrí tu sobre diario para obtener 4 cartas coleccionables.',
      cantidadCartas: 4,
      urlImagen: urlSobreCentro,
      disponible: true,
      tipo: 'gratis',
    },
    {
      id: 'sobre-misterioso',
      titulo: 'Sobre Misterioso',
      descripcion: 'Cartas sorpresa con mayor probabilidad de rareza especial.',
      cantidadCartas: 3,
      urlImagen: urlSobreIzquierda,
      disponible: true,
      tipo: 'misterio',
    },
    {
      id: 'sobre-marcas',
      titulo: 'Sobre de Marcas Asociadas',
      descripcion: 'Cartas exclusivas de patrocinadores y beneficios.',
      cantidadCartas: 4,
      urlImagen: urlSobreDerecha,
      disponible: false,
      tipo: 'tematico',
    },
  ];

  /** Ninguna sección está activa por defecto: el dashboard no es ninguno de los destinos del dock. */
  protected readonly seccionActiva = signal<string | null>(null);
  protected readonly selectorSobresAbierto = signal<boolean>(false);
  protected readonly sobresDisponibles = this.sobresService.sobresDisponibles ?? signal<{ actuales: number; maximo: number }>({
    actuales: 2,
    maximo: 2,
  });

  ngOnInit(): void {
    this.intercambioService.verificarNovedades().subscribe();
    this.cargarSobres();
    this.cargarEstadoDiario();
    this.cargarInventarioSobres();
    this.verificarBienvenidaMazos();
  }

  /**
   * Clave en localStorage por cuenta de usuario para que todas las cuentas
   * (nuevas o existentes) reciban el aviso de sus 3 barajas de regalo al entrar a la web.
   */
  private claveBienvenidaMazos(): string {
    const usuario = this.authService.usuarioActual();
    const identificador = usuario?.id ?? usuario?.email ?? usuario?.nombreUsuario ?? 'invitado';
    return `faltauna_bienvenida_mazos_v2_usuario_${identificador}`;
  }

  private adaptarMazoParaBienvenida(mazo: MazoApi, indice: number): MazoApi {
    const cartasOrdenadas = [...(mazo.cartas ?? [])]
      .map((c) => ({
        ...c,
        imagenUrl: resolverImagenCarta(c.imagenUrl, c.nombre),
      }))
      .sort((a, b) => (b.rarezaOrden ?? 0) - (a.rarezaOrden ?? 0));

    return {
      ...mazo,
      nombre: resolverNombreMazoInicial(mazo.nombre, cartasOrdenadas, indice),
      cartas:
        cartasOrdenadas.length > 0
          ? cartasOrdenadas
          : (MAZOS_BIENVENIDA_RESPALDO[indice]?.cartas ?? []),
    };
  }

  private verificarBienvenidaMazos(): void {
    if (typeof window === 'undefined') return;
    const yaVisto = localStorage.getItem(this.claveBienvenidaMazos());
    if (yaVisto === 'true') return;

    if (this.barajaService) {
      this.barajaService.obtenerMazos().subscribe({
        next: (mazos) => {
          if (mazos && mazos.length > 0) {
            this.mazosBienvenida.set(
              mazos.slice(0, 3).map((mazo, idx) => this.adaptarMazoParaBienvenida(mazo, idx)),
            );
          } else {
            this.mazosBienvenida.set(MAZOS_BIENVENIDA_RESPALDO);
          }
          this.mostrarBienvenida();
        },
        error: () => {
          this.mazosBienvenida.set(MAZOS_BIENVENIDA_RESPALDO);
          this.mostrarBienvenida();
        },
      });
    } else {
      this.mazosBienvenida.set(MAZOS_BIENVENIDA_RESPALDO);
      this.mostrarBienvenida();
    }
  }

  private mostrarBienvenida(): void {
    this.modalBienvenidaMazosVisible.set(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        this.confeti()?.lanzar(window.innerWidth / 2, window.innerHeight * 0.35, {
          cantidad: 80,
          alcance: 360,
        });
      }
      this.sonidoService?.reproducir(SONIDOS_PARTIDA.victoria);
    }, 250);
  }

  cerrarBienvenidaMazos(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.claveBienvenidaMazos(), 'true');
    }
    this.modalBienvenidaMazosVisible.set(false);
  }

  irABarajasDesdeBienvenida(): void {
    this.cerrarBienvenidaMazos();
    this.router.navigateByUrl('/usuario/mi-baraja');
  }

  private cargarSobres(): void {
    this.sobresService.obtenerSobres().subscribe({
      next: (sobres) => {
        this.sobresCatalogo.set(sobres);
      },
      error: () => {
        // En caso de que el backend no responda, mantiene catálogo vacío
      },
    });
  }

  private cargarInventarioSobres(): void {
    const usuarioId = this.authService.usuarioActual()?.id ?? 1;
    this.sobresService.obtenerInventarioSobres(usuarioId).subscribe({
      next: (inventario) => {
        this.sobresInventario.set(inventario);
      },
      error: () => {
        // Mantener inventario vacío si falla
      },
    });
  }

  private cargarEstadoDiario(): void {
    const usuarioId = this.authService.usuarioActual()?.id ?? 1;
    this.sobresService.cargarEstadoDiario(usuarioId).subscribe({
      error: () => {
        // Mantener estado por defecto si falla
      },
    });
  }

  alCompletarApertura(): void {
    this.cargarEstadoDiario();
    this.cargarInventarioSobres();
  }

  seleccionarSeccion(id: string): void {
    const destino = this.destinos.find((d) => d.id === id);
    if (destino?.deshabilitado) {
      return;
    }
    if (id === 'intercambios') {
      this.intercambioService.marcarDashboardIntercambioVisto();
    }
    this.seccionActiva.set(id);
    if (destino?.ruta) {
      this.router.navigateByUrl(destino.ruta);
    }
  }

  irAJugar(): void {
    this.router.navigateByUrl('/usuario/jugar');
  }

  abrirSelectorSobres(): void {
    this.cargarInventarioSobres();
    this.cargarEstadoDiario();
    this.selectorSobresAbierto.set(true);
  }

  cerrarSelectorSobres(): void {
    this.selectorSobresAbierto.set(false);
  }

  abrirSobre(opcion: SobreOpcion): void {
    if (!opcion.disponible) return;
    this.cerrarSelectorSobres();
  }
}
