import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Plan, PLANES } from '../../modelos/plan.model';
import { SuscripcionEstado } from '../../servicios/suscripcion-estado.service';
import { PagosService } from '../../servicios/pagos.service';
import { AuthService } from '../../servicios/auth.service';
import { StepperSuscripcion } from '../../compartidos/componentes/stepper-suscripcion/stepper-suscripcion';
import { TarjetaPlan } from '../../compartidos/componentes/tarjeta-plan/tarjeta-plan';

/** Paso 1 del alta de campaña: elegir el plan mensual e iniciar el pago en Mercado Pago. */
@Component({
  selector: 'app-empresa-planes',
  standalone: true,
  imports: [RouterLink, StepperSuscripcion, TarjetaPlan],
  templateUrl: './empresa-planes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPlanes {
  private readonly estado = inject(SuscripcionEstado);
  private readonly pagos = inject(PagosService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly planes = PLANES;
  protected readonly cargandoPlanId = signal<number | null>(null);

  protected elegirPlan(plan: Plan): void {
    if (!this.auth.estaAutenticado()) {
      toast.error('Debes iniciar sesión como empresa para contratar un plan.');
      this.router.navigate(['/login']);
      return;
    }

    this.cargandoPlanId.set(plan.backendId);
    this.estado.planElegido.set(plan);

    this.pagos.iniciarPago(plan.backendId).subscribe({
      next: (respuesta) => {
        this.estado.ultimoPago.set(respuesta.pago);
        toast.success(
          `Conectando con Mercado Pago para el plan ${plan.nombre}...`,
        );
        this.pagos.redirigirACheckout(respuesta.urlPago);
      },
      error: (err) => {
        this.cargandoPlanId.set(null);
        const mensaje =
          err?.error?.message ||
          'No se pudo conectar con Mercado Pago. Intentá de nuevo en unos minutos.';
        toast.error(mensaje);
      },
    });
  }
}
