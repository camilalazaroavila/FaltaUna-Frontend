import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CrearUsuarioSolicitud, ROLES_REGISTRABLES, Rol } from '../../modelos/usuario.model';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html'
})
export class Registro {

  roles = ROLES_REGISTRABLES;

  nuevoUsuario: CrearUsuarioSolicitud = {
    nombreUsuario: '',
    email: '',
    password: '',
    rol: 'Usuario'
  };

  cargando = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  seleccionarRol(rol: Rol): void {
    this.nuevoUsuario.rol = rol;
  }

  registrarUsuario(): void {
    this.error = null;
    this.cargando = true;

    this.authService.registrar(this.nuevoUsuario).subscribe({
      next: () => {
        this.cargando = false;
        // Se registró, pero todavía no tiene sesión: lo mandamos a loguearse.
        this.router.navigate(['/login'], { queryParams: { registrado: '1' } });
      },
      error: (error) => {
        this.cargando = false;
        this.error = error?.error?.mensaje ?? 'No se pudo registrar el usuario. Probá de nuevo.';
      }
    });
  }
}