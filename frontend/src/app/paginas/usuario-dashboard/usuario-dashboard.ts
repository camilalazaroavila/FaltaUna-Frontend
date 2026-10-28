import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Confeti } from '@compartidos/componentes/confeti/confeti';
import { BarajaService } from '@servicios/baraja.service';
import { SonidoService, SONIDOS_PARTIDA } from '@servicios/sonido.service';
import type { MazoApi } from '@modelos/mazo.model';
import { viewChild } from '@angular/core';

@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [Header, BotonNavegacionCircular, FlujoAperturaSobres, SobreMarca, Boton, Confeti],
  templateUrl: './usuario-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioDashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly sobresService = inject(SobresService);
  private readonly authService = inject(AuthService);
  private readonly barajaService = inject(BarajaService, { optional: true });
  private readonly sonidoService = inject(SonidoService, { optional: true });
  private readonly confeti = viewChild(Confeti);

  protected readonly juegoHabilitado = true;
  protected readonly sobresCatalogo = signal<SobreRespuesta[]>([]);
  protected readonly sobresInventario = signal<readonly SobreInventarioUsuario[]>([]);
  protected readonly modalBienvenidaMazosVisible = signal<boolean>(false);
  protected readonly mazosBienvenida = signal<readonly MazoApi[]>([]);
  protected readonly urlSobreIzquierda = urlSobreIzquierda;
  protected readonly urlSobreCentro = urlSobreCentro;
  protected readonly urlSobreDerecha = urlSobreDerecha;
  protected readonly urlIconPelea = urlIconPelea;


  protected readonly destinos: readonly DestinoNavegacion[] = [
    { id: 'cartas', nombre: 'Mis cartas', ruta: '/usuario/mis-cartas', urlIcono: urlIconoMisCartas },
    { id: 'misiones', nombre: 'Misiones', ruta: '/usuario/misiones', icono: 'phosphorTrophyFill' },
    { id: 'album', nombre: 'Álbumes', ruta: '/usuario/albumes', urlIcono: urlIconoAlbum },
    { id: 'intercambios', nombre: 'Intercambio', urlIcono: urlIconoIntercambios, deshabilitado: true },
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
    this.cargarSobres();
    this.cargarEstadoDiario();
    this.cargarInventarioSobres();
    this.verificarBienvenidaMazos();
  }

  private verificarBienvenidaMazos(): void {
    if (typeof window === 'undefined') return;
    const yaVisto = localStorage.getItem('faltauna_bienvenida_mazos_v1');
    if (yaVisto === 'true') return;

    if (this.barajaService) {
      this.barajaService.obtenerMazos().subscribe({
        next: (mazos) => {
          if (mazos && mazos.length > 0) {
            this.mazosBienvenida.set(mazos.slice(0, 3));
            this.mostrarBienvenida();
          } else {
            this.mazosBienvenida.set([
              { id: 1, nombre: 'Mazo de Bienvenida 1', completo: true, cartas: [] },
              { id: 2, nombre: 'Mazo de Bienvenida 2', completo: true, cartas: [] },
              { id: 3, nombre: 'Mazo de Bienvenida 3', completo: true, cartas: [] },
            ]);
            this.mostrarBienvenida();
          }
        },
        error: () => {
          this.mazosBienvenida.set([
            { id: 1, nombre: 'Mazo de Bienvenida 1', completo: true, cartas: [] },
            { id: 2, nombre: 'Mazo de Bienvenida 2', completo: true, cartas: [] },
            { id: 3, nombre: 'Mazo de Bienvenida 3', completo: true, cartas: [] },
          ]);
          this.mostrarBienvenida();
        },
      });
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
      localStorage.setItem('faltauna_bienvenida_mazos_v1', 'true');
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