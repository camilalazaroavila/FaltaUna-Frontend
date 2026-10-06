import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Boton } from '../../compartidos/componentes/boton/boton';
import { StepperSuscripcion } from '../../compartidos/componentes/stepper-suscripcion/stepper-suscripcion';
import { PagosService } from '../../servicios/pagos.service';
import { SuscripcionEstado } from '../../servicios/suscripcion-estado.service';
import { PagoRespuesta, ResultadoUrlPago } from '../../modelos/pago.model';

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

  protected readonly resultadoRuta = signal<ResultadoUrlPago>('pendiente');
  protected readonly paymentId = signal<string | null>(null);
  protected readonly externalReference = signal<string | null>(null);
  protected readonly estadoVista = signal<EstadoVista>('cargando');
  protected readonly pago = signal<PagoRespuesta | null>(null);
  protected readonly mensajeError = signal<string | null>(null);

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

  ngOnInit(): void {
    const resultadoParam =
      (this.route.snapshot.paramMap.get('resultado') as ResultadoUrlPago) ||
      'pendiente';
    this.resultadoRuta.set(resultadoParam);

    const qp = this.route.snapshot.queryParamMap;
    const paymentId = qp.get('payment_id') || qp.get('collection_id');
    const externalRef =
      qp.get('external_reference') ||
      this.estado.ultimoPago()?.referenciaExterna;

    this.paymentId.set(paymentId);
    this.externalReference.set(externalRef ?? null);

    // Si viene con payment_id y referencia externa, sincronizar con el backend
    if (paymentId && externalRef) {
      this.confirmarConBackend(externalRef, paymentId, resultadoParam);
    } else if (externalRef) {
      this.consultarPago(externalRef, resultadoParam);
    } else {
      // Sin IDs: se basa en el resultado indicado por la URL
      this.estadoVista.set(resultadoParam === 'exito' ? 'exito' : resultadoParam === 'error' ? 'error' : 'pendiente');
    }
  }

  private confirmarConBackend(
    referencia: string,
    pagoMercadoPagoId: string,
    fallbackUrl: ResultadoUrlPago,
  ): void {
    this.pagos.confirmarPago(referencia, pagoMercadoPagoId).subscribe({
      next: (pagoConfirmado) => {
        this.pago.set(pagoConfirmado);
        this.estado.ultimoPago.set(pagoConfirmado);

        if (pagoConfirmado.estado === 'Aprobado') {
          this.estadoVista.set('exito');
        } else if (
          pagoConfirmado.estado === 'Rechazado' ||
          pagoConfirmado.estado === 'Cancelado'
        ) {
          this.estadoVista.set('error');
        } else {
          this.estadoVista.set('pendiente');
        }
      },
      error: () => {
        // Si el endpoint de confirmación falla, caemos de manera segura en el resultado de URL
        this.estadoVista.set(
          fallbackUrl === 'exito'
            ? 'exito'
            : fallbackUrl === 'error'
              ? 'error'
              : 'pendiente',
        );
      },
    });
  }

  private consultarPago(referencia: string, fallbackUrl: ResultadoUrlPago): void {
    this.pagos.obtenerPago(referencia).subscribe({
      next: (pagoExistente) => {
        this.pago.set(pagoExistente);
        this.estado.ultimoPago.set(pagoExistente);

        if (pagoExistente.estado === 'Aprobado') {
          this.estadoVista.set('exito');
        } else if (
          pagoExistente.estado === 'Rechazado' ||
          pagoExistente.estado === 'Cancelado'
        ) {
          this.estadoVista.set('error');
        } else {
          this.estadoVista.set('pendiente');
        }
      },
      error: () => {
        this.estadoVista.set(fallbackUrl);
      },
    });
  }

  protected irAlPanel(): void {
    this.router.navigate(['/empresa/panel']);
  }

  protected reintentar(): void {
    this.router.navigate(['/empresa']);
  }
}
