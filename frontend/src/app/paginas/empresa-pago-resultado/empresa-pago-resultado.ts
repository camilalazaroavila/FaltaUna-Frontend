import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { StepperSuscripcion } from '@compartidos/componentes/empresa/stepper-suscripcion/stepper-suscripcion';
import { toast } from 'ngx-sonner';
import { AlbumesService } from '@servicios/albumes.service';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { PagoRespuesta, ResultadoUrlPago } from '@modelos/pago.model';

type EstadoVista = 'cargando' | 'exito' | 'pendiente' | 'error';

/**
 * Página a la que Mercado Pago redirige tras el Checkout Pro (paso 6 del alta).
 * Sincroniza la confirmación mediante payment_id y muestra el estado final.
 * Con el pago aprobado el back ya publicó el álbum: se muestra el éxito y se redirige
 * al panel de la empresa.
 */
@Component({
  selector: 'app-empresa-pago-resultado',
  standalone: true,
  imports: [RouterLink, Boton, StepperSuscripcion, NgIcon],
  templateUrl: './empresa-pago-resultado.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPagoResultado implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pagos = inject(PagosService);
  private readonly albumes = inject(AlbumesService);
  private readonly estado = inject(SuscripcionEstado);
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private redireccion: ReturnType<typeof setTimeout> | null = null;

  private static readonly MAX_REINTENTOS = 3;
  private static readonly ESPERA_REINTENTO_MS = 2500;
  /** Cuánto se muestra el éxito antes de llevar a la empresa a su panel. */
  private static readonly ESPERA_REDIRECCION_MS = 4000;

  protected readonly resultadoRuta = signal<ResultadoUrlPago>('pendiente');
  protected readonly paymentId = signal<string | null>(null);
  protected readonly externalReference = signal<string | null>(null);
  protected readonly referenciaVerificacion = signal<string | null>(null);
  protected readonly estadoVista = signal<EstadoVista>('cargando');
  protected readonly pago = signal<PagoRespuesta | null>(null);
  protected readonly mensajeError = signal<string | null>(null);
  protected readonly reintentandoPago = signal(false);

  /** Si quedó un borrador sin pagar se puede reintentar el cobro sin rearmar el álbum. */
  protected readonly hayBorradorPendiente = this.estado.albumBorradorGuardado() !== null;

  private reintentos = 0;

  protected readonly planNombre = computed(() => {
    return (
      this.pago()?.plan?.nombre ??
      this.estado.planElegido()?.nombre ??
      'Suscripción Empresa'
    );
  });

  protected readonly montoFormateado = computed(() => {
    const monto = this.pago()?.monto ?? this.estado.planElegido()?.precio ?? 0;
    return monto.toLocaleString('es-AR');
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.temporizador) clearTimeout(this.temporizador);
      if (this.redireccion) clearTimeout(this.redireccion);
    });
  }

  ngOnInit(): void {
    const resultadoParam =
      (this.route.snapshot.paramMap.get('resultado') as ResultadoUrlPago) ||
      'pendiente';
    this.resultadoRuta.set(resultadoParam);

    const qp = this.route.snapshot.queryParamMap;
    const paymentId = qp.get('payment_id') || qp.get('collection_id');
    const externalRef =
      qp.get('external_reference') ??
      this.estado.ultimoPago()?.referenciaExterna ??
      this.estado.referenciaGuardada();

    this.paymentId.set(paymentId);
    this.externalReference.set(externalRef ?? null);
    this.referenciaVerificacion.set(externalRef ?? null);

    // Recuerda la referencia para que `pagoAprobadoGuard` pueda revalidar el pago
    // contra el backend aunque se recargue la página o falle la confirmación.
    if (externalRef) this.estado.recordarReferencia(externalRef);

    // La URL sola no alcanza para dar el pago por acreditado: siempre se valida
    // contra el backend antes de mostrar el éxito y habilitar el paso 2.
    if (externalRef && paymentId) {
      this.confirmarConBackend(externalRef, paymentId);
    } else if (externalRef) {
      this.consultarPago(externalRef);
    } else {
      // Sin referencia ni payment_id no hay nada que verificar.
      this.estadoVista.set(resultadoParam === 'error' ? 'error' : 'pendiente');
    }
  }

  private confirmarConBackend(referencia: string, pagoMercadoPagoId: string): void {
    this.pagos.confirmarPago(referencia, pagoMercadoPagoId).subscribe({
      next: (pago) => this.aplicarPago(pago),
      // Si la confirmación directa falla, se usa el estado que ya tenga el backend
      // (el webhook pudo haber procesado el cobro) antes de reintentar.
      error: () => this.consultarPago(referencia),
    });
  }

  private consultarPago(referencia: string): void {
    this.pagos.obtenerPago(referencia).subscribe({
      next: (pago) => this.aplicarPago(pago),
      error: () => this.reintentarOEstadoFinal(),
    });
  }

  private aplicarPago(pago: PagoRespuesta): void {
    this.pago.set(pago);
    this.estado.ultimoPago.set(pago);

    if (pago.estado === 'Aprobado') {
      // Se corta cualquier reintento pendiente; ya no hace falta seguir verificando.
      if (this.temporizador) clearTimeout(this.temporizador);
      this.temporizador = null;
      this.estadoVista.set('exito');
      this.alAprobarse();
      return;
    }

    if (pago.estado === 'Rechazado' || pago.estado === 'Cancelado') {
      this.estadoVista.set('error');
      return;
    }

    this.reintentarOEstadoFinal();
  }

  /**
   * El backend todavía no confirma el cobro. Si el usuario volvió con un pago
   * exitoso se reintenta la verificación unos segundos (el webhook puede demorar);
   * si no, se muestra el estado pendiente con la opción de verificar de nuevo.
   */
  private reintentarOEstadoFinal(): void {
    const referencia = this.referenciaVerificacion();
    if (referencia && this.puedeReintentar()) {
      this.reintentos++;
      this.estadoVista.set('cargando');
      this.temporizador = setTimeout(
        () => this.verificarPago(referencia),
        EmpresaPagoResultado.ESPERA_REINTENTO_MS,
      );
      return;
    }

    this.estadoVista.set(this.resultadoRuta() === 'error' ? 'error' : 'pendiente');
  }

  private puedeReintentar(): boolean {
    return (
      this.resultadoRuta() === 'exito' && this.reintentos < EmpresaPagoResultado.MAX_REINTENTOS
    );
  }

  /** Verifica el pago contra el backend: confirma con el id de MP si lo tiene. */
  private verificarPago(referencia: string): void {
    const pagoId = this.paymentId();
    if (pagoId) this.confirmarConBackend(referencia, pagoId);
    else this.consultarPago(referencia);
  }

  protected verificarDeNuevo(): void {
    const referencia = this.referenciaVerificacion();
    if (!referencia) return;

    if (this.temporizador) clearTimeout(this.temporizador);
    this.reintentos = 0;
    this.estadoVista.set('cargando');
    this.verificarPago(referencia);
  }

  /**
   * Pago aprobado: el álbum ya quedó publicado en el back. Se marca el alta como completa y,
   * pasados unos segundos, se lleva a la empresa a su panel (también hay un botón para ir ya).
   */
  private alAprobarse(): void {
    this.estado.marcarAltaCompletada();
    this.estado.olvidarAlbumBorrador();
    if (this.redireccion) return;

    this.redireccion = setTimeout(
      () => this.irAlPanel(),
      EmpresaPagoResultado.ESPERA_REDIRECCION_MS,
    );
  }

  protected irAlPanel(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    if (this.redireccion) clearTimeout(this.redireccion);
    this.router.navigate(['/empresa/panel']);
  }

  /**
   * Pago rechazado o cancelado: si el borrador sigue en el back se crea un pago nuevo para ese
   * mismo álbum y se vuelve a Mercado Pago; si no, se vuelve a elegir plan.
   */
  protected reintentar(): void {
    const albumId = this.estado.albumBorradorGuardado();
    if (albumId === null) {
      this.router.navigate(['/empresa']);
      return;
    }

    this.reintentandoPago.set(true);
    this.albumes.pagar(albumId).subscribe({
      next: (respuesta) => {
        this.estado.ultimoPago.set(respuesta.pago);
        this.estado.recordarReferencia(respuesta.pago.referenciaExterna);
        this.pagos.redirigirACheckout(respuesta.urlPago);
      },
      error: (err) => {
        this.reintentandoPago.set(false);
        toast.error(
          err?.error?.mensaje || err?.error?.message || 'No se pudo conectar con Mercado Pago. Intentá de nuevo.',
        );
      },
    });
  }
}