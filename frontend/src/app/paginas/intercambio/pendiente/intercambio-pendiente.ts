import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Header } from '@compartidos/componentes/layout/header/header';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { IntercambioService } from '@servicios/intercambio.service';
import { AuthService } from '@servicios/auth.service';
import type { Carta } from '@modelos/carta.model';
import type { IntercambioActivoApi } from '@modelos/intercambio.model';
import { categoriaCartaDesdeNombre } from '@modelos/carta.model';
import { mapearRareza, resolverImagenCarta } from '@servicios/baraja.service';

export type FaseAnimacionIntercambio = 'ninguna' | 'animando' | 'conseguiste';
export type PasoAnimacionIntercambio = 'inicial' | 'temblando' | 'cruzando' | 'aterrizado';

@Component({
  selector: 'app-intercambio-pendiente',
  standalone: true,
  imports: [Header, RouterLink, CartaComponent],
  templateUrl: './intercambio-pendiente.html',
  styleUrl: './intercambio-pendiente.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntercambioPendiente implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly intercambioService = inject(IntercambioService);
  private readonly authService = inject(AuthService);

  @ViewChild('slotIzquierdo') private readonly slotIzquierdoRef?: ElementRef<HTMLElement>;
  @ViewChild('slotDerecho') private readonly slotDerechoRef?: ElementRef<HTMLElement>;

  protected readonly cargando = signal(true);
  protected readonly procesando = signal(false);
  protected readonly errorMensaje = signal<string | null>(null);
  protected readonly modalRechazoAbierto = signal(false);

  // Estados de la animación cinemática
  protected readonly faseAnimacion = signal<FaseAnimacionIntercambio>('ninguna');
  protected readonly animacionPaso = signal<PasoAnimacionIntercambio>('inicial');
  protected readonly swapDistanciaPx = signal(220);

  protected readonly intercambio = signal<IntercambioActivoApi | null>(null);
  protected readonly cartaOfertante = signal<Carta | null>(null);
  protected readonly cartaReceptor = signal<Carta | null>(null);
  protected readonly nombreOtroUsuario = signal<string>('El coleccionista');
  protected readonly diasRestantes = signal<number>(3);

  private readonly timeouts: ReturnType<typeof setTimeout>[] = [];

  protected readonly usuarioActualId = computed(
    () => this.authService.usuarioActual()?.id ?? 0,
  );

  protected readonly esOfertante = computed(() => {
    const item = this.intercambio();
    if (!item) return true;
    const ofertanteId = item.usuarioOfertanteId ?? item.ofertanteId;
    return ofertanteId === this.usuarioActualId();
  });

  protected readonly esPendiente = computed(() => {
    const estado = this.intercambio()?.estado;
    return !estado || estado === 'PENDIENTE';
  });

  protected readonly esEnRevision = computed(() => {
    return this.intercambio()?.estado === 'EN_REVISION';
  });

  protected readonly esAceptado = computed(() => {
    return this.intercambio()?.estado === 'ACEPTADO';
  });

  // Etiquetas "VOS" y nombre del otro usuario sobre cada carta
  protected readonly etiquetaCartaIzquierda = computed(() => {
    return this.esOfertante() ? 'VOS' : this.nombreOtroUsuario();
  });

  protected readonly etiquetaCartaDerecha = computed(() => {
    return this.esOfertante() ? this.nombreOtroUsuario() : 'VOS';
  });

  // Carta que el usuario actual obtiene al concretar el intercambio
  protected readonly cartaConseguida = computed<Carta | null>(() => {
    return this.esOfertante() ? this.cartaReceptor() : this.cartaOfertante();
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const intercambioId = idParam ? Number(idParam) : null;

    if (intercambioId) {
      this.cargarIntercambio(intercambioId);
    } else {
      this.cargarDesdeEstadoLocal();
    }
  }

  ngOnDestroy(): void {
    this.timeouts.forEach((t) => clearTimeout(t));
  }

  private cargarIntercambio(id: number): void {
    this.cargando.set(true);
    this.intercambioService.obtenerIntercambioPorId(id).subscribe({
      next: (item) => {
        if (item) {
          this.intercambio.set(item);
          this.procesarIntercambio(item);
        } else {
          this.cargarDesdeEstadoLocal();
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargarDesdeEstadoLocal();
        this.cargando.set(false);
      },
    });
  }

  private procesarIntercambio(item: IntercambioActivoApi): void {
    const usuarioActualId = this.authService.usuarioActual()?.id;
    const ofertanteId = item.usuarioOfertanteId ?? item.ofertanteId;
    const receptorId = item.usuarioReceptorId ?? item.receptorId;
    const soyOfertante = ofertanteId === usuarioActualId;

    const ofertanteNombre = item.usuarioOfertanteNombre || item.ofertante || 'Coleccionista';
    const receptorNombre = item.usuarioReceptorNombre || item.receptor || 'Coleccionista';

    this.nombreOtroUsuario.set(soyOfertante ? receptorNombre : ofertanteNombre);

    this.diasRestantes.set(
      this.intercambioService.calcularDiasRestantes(item.fechaVencimiento),
    );

    const carta1 = item.cartas.find((c) => c.usuarioId === ofertanteId);
    if (carta1) {
      const nombre = carta1.cartaNombre || carta1.nombre || '';
      const img = carta1.cartaImagenUrl ?? carta1.imagenUrl;
      const rarezaStr = carta1.cartaRareza || carta1.rareza || 'Común';
      const rarezaId = carta1.cartaRarezaId ?? carta1.rarezaId ?? 1;

      this.cartaOfertante.set({
        id: String(carta1.cartaId),
        nombre,
        imagenUrl: resolverImagenCarta(img, nombre),
        rareza: mapearRareza(rarezaStr, rarezaId),
        categoria: categoriaCartaDesdeNombre(''),
        atributoDerecho: 0,
        atributoIzquierdo: 0,
        obtenida: true,
      });
    }

    const carta2 = item.cartas.find((c) => c.usuarioId === receptorId);
    if (carta2) {
      const nombre = carta2.cartaNombre || carta2.nombre || '';
      const img = carta2.cartaImagenUrl ?? carta2.imagenUrl;
      const rarezaStr = carta2.cartaRareza || carta2.rareza || 'Común';
      const rarezaId = carta2.cartaRarezaId ?? carta2.rarezaId ?? 1;

      this.cartaReceptor.set({
        id: String(carta2.cartaId),
        nombre,
        imagenUrl: resolverImagenCarta(img, nombre),
        rareza: mapearRareza(rarezaStr, rarezaId),
        categoria: categoriaCartaDesdeNombre(''),
        atributoDerecho: 0,
        atributoIzquierdo: 0,
        obtenida: true,
      });
    }

    // Si ya está Aceptado (ej: Receptor ingresa a verlo desde Recibidas)
    // iniciamos la animación cinematográfica de cierre
    if (item.estado === 'ACEPTADO') {
      const timer = setTimeout(() => {
        this.iniciarAnimacionIntercambio();
      }, 600);
      this.timeouts.push(timer);
    }
  }

  private cargarDesdeEstadoLocal(): void {
    const col = this.intercambioService.coleccionistaSeleccionado();
    if (col) {
      this.nombreOtroUsuario.set(col.nombreUsuario);
    }
    const carta = this.intercambioService.cartaOfrecida();
    if (carta) {
      this.cartaOfertante.set(carta);
    }
    this.diasRestantes.set(3);
    this.cargando.set(false);
  }

  confirmar(): void {
    const item = this.intercambio();
    if (!item || this.procesando()) return;

    this.procesando.set(true);
    this.errorMensaje.set(null);

    this.intercambioService.confirmarIntercambio(item.id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.iniciarAnimacionIntercambio();
      },
      error: (err) => {
        this.procesando.set(false);
        this.errorMensaje.set(
          err?.error?.mensaje ?? 'No se pudo confirmar el intercambio. Inténtalo de nuevo.',
        );
      },
    });
  }

  abrirModalRechazo(): void {
    this.modalRechazoAbierto.set(true);
  }

  cerrarModalRechazo(): void {
    if (this.procesando()) return;
    this.modalRechazoAbierto.set(false);
  }

  confirmarRechazo(): void {
    const item = this.intercambio();
    if (!item || this.procesando()) return;

    this.procesando.set(true);
    this.intercambioService.rechazarIntercambio(item.id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.modalRechazoAbierto.set(false);
        this.router.navigate(['/usuario/intercambio/activos']);
      },
      error: (err) => {
        this.procesando.set(false);
        this.errorMensaje.set(
          err?.error?.mensaje ?? 'No se pudo rechazar el intercambio.',
        );
        this.modalRechazoAbierto.set(false);
      },
    });
  }

  iniciarAnimacionIntercambio(): void {
    // 1. Medir distancia exacta entre slots para fluidez perfecta
    if (this.slotIzquierdoRef?.nativeElement && this.slotDerechoRef?.nativeElement) {
      const rectIzq = this.slotIzquierdoRef.nativeElement.getBoundingClientRect();
      const rectDer = this.slotDerechoRef.nativeElement.getBoundingClientRect();
      const distancia = Math.round(rectDer.left - rectIzq.left);
      if (distancia > 50) {
        this.swapDistanciaPx.set(distancia);
      }
    }

    this.faseAnimacion.set('animando');
    this.animacionPaso.set('temblando');

    // Paso 2: Jaime y Falti entran y las cartas tiemblan. A los 750ms inician el cruce
    const t1 = setTimeout(() => {
      this.animacionPaso.set('cruzando');
    }, 750);
    this.timeouts.push(t1);

    // Paso 3: Aterrizan en lugares opuestos, brillos y salida de personajes
    const t2 = setTimeout(() => {
      this.animacionPaso.set('aterrizado');
    }, 1900);
    this.timeouts.push(t2);

    // Paso 4: Revelación CONSEGUISTE
    const t3 = setTimeout(() => {
      this.animacionPaso.set('inicial');
      this.faseAnimacion.set('conseguiste');
    }, 2800);
    this.timeouts.push(t3);
  }

  finalizarYSalir(): void {
    const item = this.intercambio();
    if (item) {
      this.intercambioService.archivarIntercambioCompletado(item.id);
    }
    this.router.navigate(['/usuario/intercambio/activos']);
  }
}
