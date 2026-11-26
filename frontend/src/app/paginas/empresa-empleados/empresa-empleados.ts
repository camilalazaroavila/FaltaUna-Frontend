import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UsuariosService } from '@servicios/usuario.service';

@Component({
  selector: 'app-empresa-empleados',
  standalone: true,
  templateUrl: './empresa-empleados.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaEmpleados {
  private readonly usuariosService = inject(UsuariosService);

  protected readonly nombreUsuario = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly registrando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  protected registrar(event: Event): void {
    event.preventDefault();
    const nombreUsuario = this.nombreUsuario().trim();
    const email = this.email().trim();
    const password = this.password();

    if (!nombreUsuario || !email || !password) {
      this.error.set('Completá todos los campos para registrar al empleado.');
      return;
    }

    this.registrando.set(true);
    this.error.set(null);
    this.exito.set(null);

    this.usuariosService.registrarEmpleado({ nombreUsuario, email, password }).subscribe({
      next: (empleado) => {
        this.registrando.set(false);
        this.exito.set(`Empleado "${empleado.nombreUsuario}" registrado correctamente.`);
        this.nombreUsuario.set('');
        this.email.set('');
        this.password.set('');
      },
      error: (err) => {
        this.registrando.set(false);
        this.error.set(
          err?.error?.mensaje ?? err?.error?.title ?? 'No se pudo registrar el empleado.',
        );
      },
    });
  }
}
