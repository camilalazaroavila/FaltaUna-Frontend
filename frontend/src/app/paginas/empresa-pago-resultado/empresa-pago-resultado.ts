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
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { PagoRespuesta, ResultadoUrlPago } from '@modelos/pago.model';

type EstadoVista = 'cargando' | 'exito' | 'pendiente' | 'error';

/**
 * Página a la que Mercado Pago redirige tras el Checkout Pro.
 * Sincroniza la confirmación mediante payment_id y muestra el estado final.
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
  private readonly estado = inject(SuscripcionEstado);
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  /** Segundos que se muestra el pago aprobado antes de pasar solo al paso 3. */
  private static readonly ESPERA_AVANCE_MS = 3000;

  private static readonly MAX_REINTENTOS = 3;
  private static readonly ESPERA_REINTENTO_MS = 2500;

  protected readonly resultadoRuta = signal<ResultadoUrlPago>('pendiente');
  protected readonly paymentId = signal<string | null>(null);
  protected readonly externalReference = signal<string | null>(null);
  protected readonly referenciaVerificacion = signal<string | null>(null);
  protected readonly estadoVista = signal<EstadoVista>('cargando');
  protected readonly pago = signal<PagoRespuesta | null>(null);
  protected readonly mensajeError = signal<string | null>(null);

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
    // contra el backend antes de mostrar el éxito y habilitar el paso 3.
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

  /** Refleja el pago confirmado por el backend. Si está aprobado, avanza solo al paso 3. */
  private aplicarPago(pago: PagoRespuesta): void {
    this.pago.set(pago);
    this.estado.ultimoPago.set(pago);

    if (pago.estado === 'Aprobado') {
      this.estadoVista.set('exito');
      // Solo se avanza solo con un pago VERIFICADO por el backend (el guard del paso 3 lo exige).
      if (this.temporizador) clearTimeout(this.temporizador);
      this.temporizador = setTimeout(
        () => this.irACrearAlbum(),
        EmpresaPagoResultado.ESPERA_AVANCE_MS,
      );
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

  /** Pago aprobado: sigue el alta en el paso 3 (nombre e imágenes de la marca). */
  protected irACrearAlbum(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.router.navigate(['/empresa/album/crear/marca']);
  }

  protected reintentar(): void {
    this.router.navigate(['/empresa']);
  }
}