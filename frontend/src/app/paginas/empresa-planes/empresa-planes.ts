import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Plan, PLANES } from '../../modelos/plan.model';
import { SuscripcionEstado } from '../../servicios/suscripcion-estado.service';
import { StepperSuscripcion } from '../../compartidos/componentes/stepper-suscripcion/stepper-suscripcion';
import { TarjetaPlan } from '../../compartidos/componentes/tarjeta-plan/tarjeta-plan';

/** Paso 1 del alta de campaña: elegir el plan mensual. */
@Component({
  selector: 'app-empresa-planes',
  standalone: true,
  imports: [RouterLink, StepperSuscripcion, TarjetaPlan],
  templateUrl: './empresa-planes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPlanes {
  private readonly estado = inject(SuscripcionEstado);

  protected readonly planes = PLANES;

  protected elegirPlan(plan: Plan): void {
    this.estado.planElegido.set(plan);
    // TODO paso 2: navegar a los datos de la marca (/empresa/marca).
    toast.info(`Elegiste el plan ${plan.nombre}. El siguiente paso se habilita pronto.`);
  }
}
