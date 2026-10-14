import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SobresService } from '../../servicios/sobres.service';
import { BotonNavegacionCircular } from '../../compartidos/componentes/boton-navegacion-circular/boton-navegacion-circular';
import { FlujoAperturaSobres } from '../../compartidos/componentes/flujo-apertura-sobres/flujo-apertura-sobres';
import { Header } from '../../compartidos/componentes/header/header';
import { SobreMarca } from '../../compartidos/componentes/sobre-marca/sobre-marca';
import { SobreRespuesta } from '../../modelos/sobre.model';

import urlSobreIzquierda from '../../compartidos/SVGs/PaqueteHuhDosColores.svg';
import urlSobreCentro from '../../compartidos/SVGs/Paquete1.svg';
import urlSobreDerecha from '../../compartidos/SVGs/Paquete2.svg';
import urlIconPelea from '../../compartidos/SVGs/IconPelea.svg';

import urlIconoMisCartas from '../../compartidos/SVGs/Icon_misCartas.svg';
import urlIconoAlbum from '../../compartidos/SVGs/Icon_Album.svg';
import urlIconoIntercambios from '../../compartidos/SVGs/Icon_Intercambio.svg';
import urlIconoQr from '../../compartidos/SVGs/Icon_Qr.svg';
import urlIconoDescuento from '../../compartidos/SVGs/Icon_Descuento.svg';

export interface DestinoNavegacion {
  readonly id: string;
  readonly nombre: string;
  readonly ruta?: string;
  readonly urlIcono?: string;
  readonly icono?: string;
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

@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [Header, BotonNavegacionCircular, FlujoAperturaSobres, SobreMarca],
  templateUrl: './usuario-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioDashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly sobresService = inject(SobresService);
  protected readonly sobresCatalogo = signal<SobreRespuesta[]>([]);
  protected readonly urlSobreIzquierda = urlSobreIzquierda;
  protected readonly urlSobreCentro = urlSobreCentro;
  protected readonly urlSobreDerecha = urlSobreDerecha;
  protected readonly urlIconPelea = urlIconPelea;

  /** pal mvp2 puse inhabilitado el jugar, para que aparezca nomas se pone en true, o se saca esta linea y el if del html q encierra el icono */
  protected readonly juegoHabilitado = false;

  protected readonly destinos: readonly DestinoNavegacion[] = [
    { id: 'cartas', nombre: 'Mis cartas', ruta: '/usuario/mis-cartas', urlIcono: urlIconoMisCartas },
    { id: 'misiones', nombre: 'Misiones', ruta: '/usuario/misiones', icono: 'phosphorTrophyFill' },
    { id: 'album', nombre: 'Álbumes', ruta: '/usuario/albumes', urlIcono: urlIconoAlbum },
    { id: 'intercambios', nombre: 'Intercambio', urlIcono: urlIconoIntercambios },
    { id: 'qr', nombre: 'Canje', urlIcono: urlIconoQr },
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
  protected readonly sobresDisponibles = signal<{ actuales: number; maximo: number }>({
    actuales: 2,
    maximo: 2,
  });

  ngOnInit(): void {
    this.cargarSobres();
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

  alCompletarApertura(): void {
    this.sobresDisponibles.update((s) => ({
      ...s,
      actuales: Math.max(0, s.actuales - 1),
    }));
  }

  seleccionarSeccion(id: string): void {
    this.seccionActiva.set(id);
    const destino = this.destinos.find((d) => d.id === id);
    if (destino?.ruta) {
      this.router.navigateByUrl(destino.ruta);
    }
  }

  abrirSelectorSobres(): void {
    this.selectorSobresAbierto.set(true);
  }

  cerrarSelectorSobres(): void {
    this.selectorSobresAbierto.set(false);
  }

  abrirSobre(opcion: SobreOpcion): void {
    if (!opcion.disponible) return;
    // Si quedan sobres disponibles se descuenta 1
    this.sobresDisponibles.update((s) => ({
      ...s,
      actuales: Math.max(0, s.actuales - 1),
    }));
    this.cerrarSelectorSobres();
  }
}