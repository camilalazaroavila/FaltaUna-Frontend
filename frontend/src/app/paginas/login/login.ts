import { ChangeDetectionStrategy, Component, OnInit, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { LoginSolicitud } from '../../modelos/usuario.model';
import { AuthLayout } from '../../compartidos/componentes/auth-layout/auth-layout';
import { injectModoAuth } from '../../compartidos/componentes/auth-layout/auth-modo';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthLayout],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit {
  protected readonly modo = injectModoAuth();

  protected readonly encabezado = computed(() =>
    this.modo() === 'empresa'
      ? {
          eyebrow: 'Tu marca, acá',
          titulo: 'Ingresá a tu panel',
          descripcion: 'Gestioná tus colecciones y la publicidad de tu marca desde el panel.',
        }
      : {
          eyebrow: 'Bienvenido de nuevo',
          titulo: 'Entrá a tu cuenta',
          descripcion: 'Ingresá con tu usuario o email para seguir coleccionando.',
        },
  );

  credenciales: LoginSolicitud = {
    identificador: '',
    password: ''
  };

  cargando = false;
  error: string | null = null;
  recienRegistrado = false;

  private ultimoModo: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ruta: ActivatedRoute
  ) {
    // El toggle cambia el modo sin recargar: se conservan los datos, menos la contraseña.
    effect(() => {
      const modo = this.modo();
      if (this.ultimoModo !== null && this.ultimoModo !== modo) {
        this.credenciales.password = '';
      }
      this.ultimoModo = modo;
    });
  }

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