import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SobresService } from '../../../servicios/sobres.service';
import { AuthService } from '../../../servicios/auth.service';
import { PanelDesplazable } from '../panel-desplazable/panel-desplazable';
import {
  AperturaSobreRespuesta,
  CartaObtenidaRespuesta,
  SobreItemUI,
  SobreRespuesta,
} from '../../../modelos/sobre.model';

import urlPaquete1 from '../../SVGs/Paquete1.svg';
import urlPaquete2 from '../../SVGs/Paquete2.svg';
import urlPaqueteHuh from '../../SVGs/PaqueteHuh.svg';
import urlCartaComun from '../../SVGs/CartaComunPlaceholder.svg';
import urlCartaRara from '../../SVGs/CartaRaraPlaceholder.svg';
import urlEpicarta from '../../SVGs/EpicartaPlaceholder.svg';

export type FaseApertura = 'cerrado' | 'seleccion' | 'preview' | 'carrusel' | 'corte' | 'revelacion';

@Component({
  selector: 'app-flujo-apertura-sobres',
  standalone: true,
  imports: [CommonModule, PanelDesplazable],
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

  // Outputs
  readonly cerrar = output<void>();
  readonly aperturaRealizada = output<AperturaSobreRespuesta>();

  // Estado del flujo
  protected readonly fase = signal<FaseApertura>('seleccion');
  protected readonly sobreSeleccionado = signal<SobreItemUI | null>(null);
  protected readonly indiceCarrusel = signal<number>(2); // Posición centrada entre 5 sobres
  protected readonly cortando = signal<boolean>(false);
  protected readonly sobreCortado = signal<boolean>(false);
  protected readonly cargandoApertura = signal<boolean>(false);
  protected readonly errorApertura = signal<string | null>(null);
  protected readonly cartasObtenidas = signal<CartaObtenidaRespuesta[]>([]);
  protected readonly indiceCartaActual = signal<number>(0);

  // Assets
  protected readonly urlPaquete1 = urlPaquete1;
  protected readonly urlPaquete2 = urlPaquete2;
  protected readonly urlPaqueteHuh = urlPaqueteHuh;
  protected readonly urlCartaComun = urlCartaComun;
  protected readonly Math = Math;

  // Lista normalizada de sobres UI para mostrar en el grid
  protected readonly listaSobresUI = computed<SobreItemUI[]>(() => {
    const catalogo = this.sobresCatalogo();
    const diarios = this.sobresDiariosDisponibles();

    const items: SobreItemUI[] = [];

    // Sobre Diario (siempre presente como opción gratuita)
    items.push({
      id: 'diario',
      nombre: 'Sobre Diario Gratuito',
      etiqueta: 'GRATIS',
      tipo: 'GENERAL',
      precio: 0,
      cantidadCartas: 4,
      urlImagen: urlPaquete1,
      esDiario: true,
      disponible: diarios > 0,
    });

    // Sobres provenientes del backend
    for (let i = 0; i < catalogo.length; i++) {
      const s = catalogo[i];
      const imagen = i % 2 === 0 ? urlPaquete2 : urlPaqueteHuh;
      const etiqueta = s.marca ?? s.categoria ?? (s.tipo === 'GENERAL' ? 'CLÁSICO' : s.nombre);
      items.push({
        id: s.id,
        nombre: s.nombre,
        etiqueta: etiqueta.toUpperCase(),
        tipo: s.tipo,
        precio: s.precio,
        cantidadCartas: s.cantidadCartas,
        urlImagen: imagen,
        esDiario: false,
        disponible: true,
      });
    }

    return items;
  });

  // Los 5 sobres replicados en el carrusel de Pokémon Pocket
  protected readonly sobresCarrusel = computed(() => {
    const sel = this.sobreSeleccionado();
    if (!sel) return [];
    return [0, 1, 2, 3, 4].map((index) => ({
      index,
      urlImagen: sel.urlImagen,
      nombre: sel.nombre,
      etiqueta: sel.etiqueta,
    }));
  });

  // Referencias para drag
  private dragInicioX = 0;
  private enArrastre = false;

  // Manejo de navegación entre fases
  iniciar(): void {
    this.fase.set('seleccion');
    this.sobreSeleccionado.set(null);
    this.sobreCortado.set(false);
    this.cortando.set(false);
    this.errorApertura.set(null);
    this.cartasObtenidas.set([]);
    this.indiceCartaActual.set(0);
  }

  seleccionarSobre(sobre: SobreItemUI): void {
    this.sobreSeleccionado.set(sobre);
    this.fase.set('preview');
  }

  volverASeleccion(): void {
    this.fase.set('seleccion');
  }

  irACarrusel(): void {
    this.indiceCarrusel.set(2);
    this.fase.set('carrusel');
  }

  cambiarSobreCarrusel(direccion: number): void {
    const actual = this.indiceCarrusel();
    const nuevo = Math.max(0, Math.min(4, actual + direccion));
    this.indiceCarrusel.set(nuevo);
  }

  elegirSobreDelCarrusel(index: number): void {
    this.indiceCarrusel.set(index);
    this.fase.set('corte');
    this.sobreCortado.set(false);
    this.cortando.set(false);
    this.errorApertura.set(null);
  }

  // Interacción de corte del sobre (drag o click)
  ejecutarCorte(): void {
    if (this.cortando() || this.sobreCortado() || this.cargandoApertura()) return;

    this.cortando.set(true);
    this.errorApertura.set(null);

    // Animación visual de corte
    setTimeout(() => {
      this.sobreCortado.set(true);
      this.cortando.set(false);
      this.llamarApiApertura();
    }, 450);
  }

  private llamarApiApertura(): void {
    const sobre = this.sobreSeleccionado();
    const usuario = this.authService.usuarioActual();
    const usuarioId = usuario?.id ?? 1;

    this.cargandoApertura.set(true);

    const llamada$ = sobre?.esDiario
      ? this.sobresService.reclamarSobreDiario(usuarioId)
      : this.sobresService.abrirSobre(Number(sobre?.id), usuarioId);

    llamada$.subscribe({
      next: (resp) => {
        this.cargandoApertura.set(false);
        this.cartasObtenidas.set([...resp.cartas]);
        this.indiceCartaActual.set(0);
        this.aperturaRealizada.emit(resp);

        // Transición a la pantalla de revelación con cartas
        setTimeout(() => {
          this.fase.set('revelacion');
        }, 300);
      },
      error: (err) => {
        this.cargandoApertura.set(false);
        const mensaje =
          err?.error?.mensaje ??
          err?.error ??
          'No fue posible abrir el sobre en este momento. Intenta nuevamente.';
        this.errorApertura.set(typeof mensaje === 'string' ? mensaje : 'Error al abrir el sobre');
      },
    });
  }

  // Drag para carrusel
  onPointerDownCarrusel(event: PointerEvent): void {
    this.dragInicioX = event.clientX;
    this.enArrastre = true;
  }

  onPointerUpCarrusel(event: PointerEvent): void {
    if (!this.enArrastre) return;
    this.enArrastre = false;
    const deltaX = event.clientX - this.dragInicioX;
    if (deltaX > 40) {
      this.cambiarSobreCarrusel(-1);
    } else if (deltaX < -40) {
      this.cambiarSobreCarrusel(1);
    }
  }

  // Siguiente carta o finalizar
  avanzarOFinalizar(): void {
    const actual = this.indiceCartaActual();
    const total = this.cartasObtenidas().length;
    if (actual < total - 1) {
      this.indiceCartaActual.set(actual + 1);
    } else {
      this.cerrarFlujo();
    }
  }

  cerrarFlujo(): void {
    this.fase.set('cerrado');
    this.cerrar.emit();
  }

  obtenerImagenCarta(carta: CartaObtenidaRespuesta): string {
    if (carta.imagenUrl && carta.imagenUrl.trim() !== '') {
      return carta.imagenUrl;
    }
    return this.urlCartaComun;
  }
}
