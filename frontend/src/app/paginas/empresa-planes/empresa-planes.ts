import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Plan, PLANES } from '@modelos/plan.model';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AuthService } from '@servicios/auth.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { EncabezadoPaso } from '@compartidos/componentes/controles/encabezado-paso/encabezado-paso';
import { TarjetaPlan } from '@compartidos/componentes/empresa/tarjeta-plan/tarjeta-plan';

/**
 * Paso 1 del alta de campaña: elegir el plan mensual.
 * Solo se guarda la elección y se sigue al paso 2: el pago con Mercado Pago se hace al final,
 * desde la vista previa del álbum.
 */
@Component({
  selector: 'app-empresa-planes',
  standalone: true,
  imports: [EncabezadoPaso, TarjetaPlan],
  templateUrl: './empresa-planes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPlanes {
  private readonly estado = inject(SuscripcionEstado);
  private readonly borrador = inject(AlbumBorrador);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly planes = PLANES;

  protected elegirPlan(plan: Plan): void {
    if (!this.auth.estaAutenticado()) {
      toast.error('Debes iniciar sesión como empresa para contratar un plan.');
      this.router.navigate(['/login']);
      return;
    }

    // El plan queda atado al álbum borrador en el back. Si ya había uno armado con otro plan
    // (la empresa volvió al paso 1), se arranca un borrador nuevo para no mezclar planes.
    const anterior = this.estado.planElegido();
    if (anterior && anterior.backendId !== plan.backendId && this.borrador.albumId() !== null) {
      this.borrador.limpiar();
      this.estado.olvidarAlbumBorrador();
    }

    this.estado.planElegido.set(plan);
    this.router.navigate(['/empresa/album/crear/marca']);
  }
}