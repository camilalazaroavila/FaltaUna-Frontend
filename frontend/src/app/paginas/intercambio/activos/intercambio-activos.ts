import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { Header } from '@compartidos/componentes/layout/header/header';
import { TarjetaUsuario } from '@compartidos/componentes/intercambio/tarjeta-usuario/tarjeta-usuario';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { IntercambioService } from '@servicios/intercambio.service';
import { AuthService } from '@servicios/auth.service';
import type { Carta } from '@modelos/carta.model';
import type { CartaIntercambioApi, IntercambioActivoApi } from '@modelos/intercambio.model';
import { categoriaCartaDesdeNombre } from '@modelos/carta.model';
import { mapearRareza, resolverImagenCarta } from '@servicios/baraja.service';

export type PestanaIntercambio = 'enviadas' | 'recibidas';

@Component({
  selector: 'app-intercambio-activos',
  standalone: true,
  imports: [Header, RouterLink, TarjetaUsuario, CartaComponent, NgTemplateOutlet],
  templateUrl: './intercambio-activos.html',
  styleUrl: './intercambio-activos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntercambioActivos implements OnInit {
  private readonly intercambioService = inject(IntercambioService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly pestanaActiva = signal<PestanaIntercambio>('enviadas');
  protected readonly intercambios = signal<readonly IntercambioActivoApi[]>([]);

  // Intercambio actualmente seleccionado para el detalle
  protected readonly intercambioSeleccionadoId = signal<number | null>(null);

  protected readonly usuarioActualId = computed(
    () => this.authService.usuarioActual()?.id ?? 0,
  );

  // Lista de intercambios enviados
  protected readonly intercambiosEnviados = computed(() => {
    const miId = this.usuarioActualId();
    return this.intercambios().filter(
      (i) => (i.usuarioOfertanteId ?? i.ofertanteId) === miId,
    );
  });

  // Lista de intercambios recibidos
  protected readonly intercambiosRecibidos = computed(() => {
    const miId = this.usuarioActualId();
    return this.intercambios().filter(
      (i) => (i.usuarioReceptorId ?? i.receptorId) === miId,
    );
  });

  // Lista correspondiente a la pestaña activa
  protected readonly listaVisible = computed(() =>
    this.pestanaActiva() === 'enviadas'
      ? this.intercambiosEnviados()
      : this.intercambiosRecibidos(),
  );

  // Intercambio activo actualmente seleccionado
  protected readonly intercambioDetalle = computed(() => {
    const lista = this.listaVisible();
    if (lista.length === 0) return null;

    const id = this.intercambioSeleccionadoId();
    if (id !== null) {
      const encontrado = lista.find((i) => i.id === id);
      if (encontrado) return encontrado;
    }
    return lista[0];
  });

  // Carta relevante para mostrar en el panel de detalle
  protected readonly cartaDetalle = computed<Carta | null>(() => {
    const intercambio = this.intercambioDetalle();
    if (!intercambio || !intercambio.cartas?.length) return null;

    const ofertanteId = intercambio.usuarioOfertanteId ?? intercambio.ofertanteId;
    const receptorId = intercambio.usuarioReceptorId ?? intercambio.receptorId;
    let cartaApi: CartaIntercambioApi | undefined;

    if (this.pestanaActiva() === 'enviadas') {
      if (intercambio.estado === 'EN_REVISION' || intercambio.estado === 'ACEPTADO') {
        // En enviadas cuando ya respondió: mostramos la carta que ofreció el receptor
        cartaApi =
          intercambio.cartas.find((c) => c.usuarioId === receptorId) ??
          intercambio.cartas[0];
      } else {
        // En enviadas mientras espera respuesta: mostramos la carta que ofreció el usuario actual
        cartaApi =
          intercambio.cartas.find((c) => c.usuarioId === ofertanteId) ??
          intercambio.cartas[0];
      }
    } else {
      // En recibidas: mostramos la carta del ofertante que nos ofreció
      cartaApi =
        intercambio.cartas.find((c) => c.usuarioId === ofertanteId) ??
        intercambio.cartas[0];
    }

    if (!cartaApi) return null;

    const nombre = cartaApi.cartaNombre || cartaApi.nombre || '';
    const img = cartaApi.cartaImagenUrl ?? cartaApi.imagenUrl;
    const rarezaNombre = cartaApi.cartaRareza || cartaApi.rareza || 'Común';
    const rarezaId = cartaApi.cartaRarezaId ?? cartaApi.rarezaId ?? 1;

    return {
      id: String(cartaApi.cartaId),
      nombre,
      imagenUrl: resolverImagenCarta(img, nombre),
      rareza: mapearRareza(rarezaNombre, rarezaId),
      categoria: categoriaCartaDesdeNombre(''),
      atributoDerecho: 0,
      atributoIzquierdo: 0,
      obtenida: true,
    };
  });

  // Nombre del otro coleccionista para el detalle
  protected readonly nombreOtroUsuarioDetalle = computed(() => {
    const intercambio = this.intercambioDetalle();
    if (!intercambio) return '';
    return this.pestanaActiva() === 'enviadas'
      ? (intercambio.usuarioReceptorNombre || intercambio.receptor || '')
      : (intercambio.usuarioOfertanteNombre || intercambio.ofertante || '');
  });

  ngOnInit(): void {
    this.intercambioService.marcarMenuIntercambioVisto();
    this.cargarIntercambios();
  }

  cargarIntercambios(): void {
    this.cargando.set(true);
    this.intercambioService.obtenerIntercambiosActivos().subscribe({
      next: (lista) => {
        this.intercambios.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.intercambios.set([]);
        this.cargando.set(false);
      },
    });
  }

  cambiarPestana(pestana: PestanaIntercambio): void {
    this.pestanaActiva.set(pestana);
    // Reiniciar selección al primer elemento de la nueva lista
    this.intercambioSeleccionadoId.set(null);
  }

  seleccionarIntercambio(id: number): void {
    const item = this.listaVisible().find((i) => i.id === id);
    if (item && this.esNovedad(item)) {
      this.intercambioService.marcarIntercambioVisto(item.id, item.estado);
    }
    // En mobile: si ya está seleccionado, permite colapsar (toggle)
    if (this.intercambioSeleccionadoId() === id) {
      this.intercambioSeleccionadoId.set(null);
    } else {
      this.intercambioSeleccionadoId.set(id);
    }
  }

  esNovedad(intercambio: IntercambioActivoApi): boolean {
    const miId = this.usuarioActualId();
    return (
      this.intercambioService.tieneActualizacionPendiente(intercambio, miId) &&
      this.intercambioService.esIntercambioNovedad(intercambio.id, intercambio.estado)
    );
  }

  calcularDias(fechaVencimiento: string): number {
    return this.intercambioService.calcularDiasRestantes(fechaVencimiento);
  }

  nombreOtro(intercambio: IntercambioActivoApi): string {
    return this.pestanaActiva() === 'enviadas'
      ? (intercambio.usuarioReceptorNombre || intercambio.receptor || '')
      : (intercambio.usuarioOfertanteNombre || intercambio.ofertante || '');
  }

  verDetalleIntercambio(intercambio: IntercambioActivoApi): void {
    this.intercambioService.marcarIntercambioVisto(intercambio.id, intercambio.estado);
    if (this.pestanaActiva() === 'enviadas') {
      // En enviadas: nos lleva a la vista de pendiente/resolución
      this.router.navigate(['/usuario/intercambio/pendiente', intercambio.id]);
    } else {
      // En recibidas:
      // Si el estado es PENDIENTE (el receptor aún no respondió): lleva a ofrecer carta.
      // Si ya está EN_REVISION o ACEPTADO: lleva a la vista de pendiente (para ver estado o reproducir animación!).
      if (intercambio.estado === 'PENDIENTE') {
        this.router.navigate(['/usuario/intercambio/responder', intercambio.id]);
      } else {
        this.router.navigate(['/usuario/intercambio/pendiente', intercambio.id]);
      }
    }
  }
}
