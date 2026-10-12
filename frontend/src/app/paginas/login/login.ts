import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@servicios/auth.service';
import { LoginSolicitud, Rol } from '@modelos/usuario.model';
import { AuthLayout } from '@compartidos/componentes/layout/auth-layout/auth-layout';
import { injectModoAuth } from '@compartidos/componentes/layout/auth-layout/auth-modo';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthLayout],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit {
  protected readonly modo = injectModoAuth();
  private readonly cdr = inject(ChangeDetectorRef);

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

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  recienRegistrado = false;

  private ultimoModo: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ruta: ActivatedRoute
  ) {
    // El toggle cambia el modo sin recargar: se conservan los datos, menos la contraseña y error previo.
    effect(() => {
      const modo = this.modo();
      if (this.ultimoModo !== null && this.ultimoModo !== modo) {
        this.credenciales.password = '';
        this.error.set(null);
      }
      this.ultimoModo = modo;
    });
  }

  ngOnInit(): void {
    this.recienRegistrado = this.ruta.snapshot.queryParamMap.get('registrado') === '1';
  }

  iniciarSesion(): void {
    this.error.set(null);
    this.cargando.set(true);

    const rolEsperado: Rol = this.modo() === 'empresa' ? 'Empresa' : 'Usuario';

    const solicitud: LoginSolicitud = {
      identificador: this.credenciales.identificador,
      password: this.credenciales.password,
      rol: rolEsperado,
    };

    this.authService.login(solicitud).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.cdr.markForCheck();
        this.router.navigate([this.authService.rutaSegunRol(respuesta.usuario.rol)]);
      },
      error: (error) => {
        this.cargando.set(false);
        this.error.set(error?.error?.mensaje ?? 'Usuario o contraseña incorrectos.');
        this.cdr.markForCheck();
      }
    });
  }
}