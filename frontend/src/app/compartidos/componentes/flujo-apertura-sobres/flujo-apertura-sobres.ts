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
  protected readonly indiceCarrusel = signal<number>(0);
  protected readonly dragOffset = signal<number>(0);
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

  // Variables de control de arrastre
  protected enArrastre = false;
  private dragInicioX = 0;
  private corteInicioX = 0;
  private arrastrandoCorte = false;

  constructor() {
    // Al abrir el modal, reiniciar automáticamente a la fase de selección
    effect(() => {
      if (this.abierto()) {
        this.iniciar();
      }
    });
  }

  // Lista normalizada de sobres UI para mostrar en el grid
  protected readonly listaSobresUI = computed<SobreItemUI[]>(() => {
    const catalogo = this.sobresCatalogo();
    const diarios = this.sobresDiariosDisponibles();

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
        cantidadCartas: 4,
        urlImagen: urlPaquete1,
        esDiario: true,
        disponible,
      });
    }

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

  // Los 8 sobres distribuidos circularmente e infinitos alrededor del centro
  protected readonly sobresCarrusel = computed(() => {
    const sel = this.sobreSeleccionado();
    if (!sel) return [];

    // Centro continuo considerando el arrastre en píxeles
    const center = this.indiceCarrusel() - this.dragOffset() / 150;

    return [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
      let rel = (k - center) % 8;
      while (rel < -4) rel += 8;
      while (rel > 4) rel -= 8;

      return {
        k,
        rel,
        urlImagen: sel.urlImagen,
        nombre: sel.nombre,
        etiqueta: sel.etiqueta,
      };
    });
  });

  // Cálculo de transformación 3D para el carrusel infinito
  obtenerTransformSobre(rel: number): string {
    const absRel = Math.abs(rel);
    const x = rel * (absRel > 1 ? 85 : 95);
    const scale = Math.max(0.55, 1.08 - absRel * 0.15);
    const rotY = rel * -16;
    return `translateX(${x}px) scale(${scale}) rotateY(${rotY}deg)`;
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

  // Manejo de navegación entre fases
  iniciar(): void {
    this.fase.set('seleccion');
    this.sobreSeleccionado.set(null);
    this.sobreCortado.set(false);
    this.cortando.set(false);
    this.errorApertura.set(null);
    this.cartasObtenidas.set([]);
    this.indiceCartaActual.set(0);
    this.indiceCarrusel.set(0);
    this.dragOffset.set(0);
    this.enArrastre = false;
    this.punteroPresionado = false;
  }

  seleccionarSobre(sobre: SobreItemUI): void {
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
    if (this.enArrastre) return;
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
      } catch {}
      this.dragOffset.set(delta);
    }
  }

  onPointerUpCarrusel(event: PointerEvent): void {
    if (!this.punteroPresionado) return;
    this.punteroPresionado = false;

    if (this.enArrastre) {
      try {
        (event.currentTarget as HTMLElement)?.releasePointerCapture?.(event.pointerId);
      } catch {}

      const delta = event.clientX - this.dragInicioX;
      if (delta > 30) {
        this.cambiarSobreCarrusel(-1);
      } else if (delta < -30) {
        this.cambiarSobreCarrusel(1);
      }
    }

    // Pequeño retardo para no procesar clicks residuales tras arrastre
    setTimeout(() => {
      this.enArrastre = false;
      this.dragOffset.set(0);
    }, 50);
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
    } catch {}
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

    // Animación visual de rasgado de solapa
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

    const llamada$ = sobre?.esDiario
      ? this.sobresService.reclamarSobreDiario(usuarioId)
      : this.sobresService.abrirSobre(Number(sobre?.id), usuarioId);

    llamada$.subscribe({
      next: (resp) => {
        this.cargandoApertura.set(false);
        const cartas =
          resp?.cartas && resp.cartas.length > 0
            ? resp.cartas
            : this.generarCartasRespaldo(sobre);

        this.cartasObtenidas.set([...cartas]);
        this.indiceCartaActual.set(0);
        this.aperturaRealizada.emit({
          ...resp,
          cartas,
        });

        // Transición fluida a revelación
        setTimeout(() => {
          this.fase.set('revelacion');
        }, 400);
      },
      error: (err) => {
        // En caso de que el backend falle o no tenga pool cargado, usamos respaldo
        this.cargandoApertura.set(false);
        const cartasFallback = this.generarCartasRespaldo(sobre);
        this.cartasObtenidas.set([...cartasFallback]);
        this.indiceCartaActual.set(0);

        const aperturaRespaldo: AperturaSobreRespuesta = {
          id: Date.now(),
          sobreId: typeof sobre?.id === 'number' ? sobre.id : 1,
          fecha: new Date().toISOString(),
          cartas: cartasFallback,
        };
        this.aperturaRealizada.emit(aperturaRespaldo);

        setTimeout(() => {
          this.fase.set('revelacion');
        }, 400);
      },
    });
  }

  /** Genera cartas de respaldo en caso de que el backend no tenga pool populado aún */
  private generarCartasRespaldo(sobre: SobreItemUI | null): CartaObtenidaRespuesta[] {
    const nombreBase = sobre?.etiqueta && sobre.etiqueta !== 'GRATIS' ? sobre.etiqueta : 'FALTA UNA';
    return [
      {
        cartaId: 101,
        nombre: `SUPER ${nombreBase}`,
        cantidad: 1,
        imagenUrl: null,
      },
      {
        cartaId: 102,
        nombre: `${nombreBase} - CAPITÁN`,
        cantidad: 1,
        imagenUrl: null,
      },
      {
        cartaId: 103,
        nombre: `${nombreBase} - DEFENSOR`,
        cantidad: 1,
        imagenUrl: null,
      },
      {
        cartaId: 104,
        nombre: `${nombreBase} - EDICIÓN ESPECIAL`,
        cantidad: 1,
        imagenUrl: null,
      },
    ];
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
