import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { LoginSolicitud } from '../../modelos/usuario.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class Login implements OnInit {

  credenciales: LoginSolicitud = {
    identificador: '',
    password: ''
  };

  cargando = false;
  error: string | null = null;
  recienRegistrado = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ruta: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.recienRegistrado = this.ruta.snapshot.queryParamMap.get('registrado') === '1';
  }

  iniciarSesion(): void {
    this.error = null;
    this.cargando = true;

    this.authService.login(this.credenciales).subscribe({
      next: (respuesta) => {
        this.cargando = false;
        this.router.navigate([this.authService.rutaSegunRol(respuesta.usuario.rol)]);
      },
      error: (error) => {
        this.cargando = false;
        this.error = error?.error?.mensaje ?? 'Usuario o contraseña incorrectos.';
      }
    });
  }
}