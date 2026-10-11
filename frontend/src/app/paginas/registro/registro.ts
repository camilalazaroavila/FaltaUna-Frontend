import { ChangeDetectionStrategy, Component, computed, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { Subject, of, debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs';
import { AuthService } from '../../servicios/auth.service';
import { CrearUsuarioSolicitud } from '../../modelos/usuario.model';
import { AuthLayout } from '../../compartidos/componentes/auth-layout/auth-layout';
import { injectModoAuth } from '../../compartidos/componentes/auth-layout/auth-modo';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink, NgxSonnerToaster, AuthLayout],
  templateUrl: './registro.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro implements OnInit, OnDestroy {
  protected readonly modo = injectModoAuth();

  /** Rol real según el modo: no hay selector de roles, el modo decide la cuenta. */
  protected readonly rol = computed<CrearUsuarioSolicitud['rol']>(() =>
    this.modo() === 'empresa' ? 'Empresa' : 'Usuario',
  );

  protected readonly encabezado = computed(() =>
    this.modo() === 'empresa'
      ? {
          eyebrow: 'Sumá tu marca',
          titulo: 'Creá tu cuenta de empresa',
          descripcion: 'Publicá tus colecciones y conseguí la publicidad que buscas.',
        }
      : {
          eyebrow: 'Empezá ahora',
          titulo: 'Traé tu colección a la realidad',
          descripcion: 'Canjeá tus colecciones por productos reales.',
        },
  );

  nuevoUsuario: CrearUsuarioSolicitud = {
    nombreUsuario: '',
    email: '',
    password: '',
    rol: 'Usuario'
  };

  nombreUsuarioDisponible = signal<boolean | null>(null);
  emailDisponible = signal<boolean | null>(null);
  verificandoNombre = signal(false);
  verificandoEmail = signal(false);
  cargando = signal(false);
  error: string | null = null;

  private nombreUsuario$ = new Subject<string>();
  private email$ = new Subject<string>();
  private destruido$ = new Subject<void>();
  private ultimoModo: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // El toggle cambia el modo sin recargar: se conservan los datos, menos la contraseña.
    effect(() => {
      const modo = this.modo();
      if (this.ultimoModo !== null && this.ultimoModo !== modo) {
        this.nuevoUsuario.password = '';
      }
      this.ultimoModo = modo;
    });
  }

  ngOnInit(): void {
    this.nombreUsuario$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((valor) => {
        const nombre = valor?.trim();
        if (!nombre || nombre.length < 3) {
          this.verificandoNombre.set(false);
          return of(null);
        }
        this.verificandoNombre.set(true);
        return this.authService.verificarDisponibilidad({ nombreUsuario: nombre }).pipe(
          catchError(() => of(null))
        );
      }),
      takeUntil(this.destruido$)
    ).subscribe((respuesta) => {
      this.verificandoNombre.set(false);
      this.nombreUsuarioDisponible.set(respuesta?.nombreUsuarioDisponible ?? null);
    });

    this.email$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((valor) => {
        const email = valor?.trim();
        if (!email || !this.validarFormatoEmail(email)) {
          this.verificandoEmail.set(false);
          return of(null);
        }
        this.verificandoEmail.set(true);
        return this.authService.verificarDisponibilidad({ email }).pipe(
          catchError(() => of(null))
        );
      }),
      takeUntil(this.destruido$)
    ).subscribe((respuesta) => {
      this.verificandoEmail.set(false);
      this.emailDisponible.set(respuesta?.emailDisponible ?? null);
    });
  }

  ngOnDestroy(): void {
    this.destruido$.next();
    this.destruido$.complete();
  }

  onNombreUsuarioChange(valor: string): void {
    this.nombreUsuarioDisponible.set(null);
    this.nombreUsuario$.next(valor);
  }

  onEmailChange(valor: string): void {
    this.emailDisponible.set(null);
    this.email$.next(valor);
  }

  get errorEmail(): string | null {
    const emailUsuario = this.nuevoUsuario.email?.trim();
    if (!emailUsuario) return null;
    return this.validarFormatoEmail(emailUsuario) ? null : 'El email no tiene un formato válido';
  }

  get formularioInvalido(): boolean {
    const nombre = this.nuevoUsuario.nombreUsuario?.trim();
    const email = this.nuevoUsuario.email?.trim();
    const password = this.nuevoUsuario.password;

    return (
      !nombre ||
      nombre.length < 3 ||
      !email ||
      !password ||
      password.length < 6 ||
      !!this.errorEmail ||
      this.verificandoNombre() ||
      this.verificandoEmail() ||
      this.nombreUsuarioDisponible() === false ||
      this.emailDisponible() === false
    );
  }

  private validarFormatoEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  registrarUsuario(): void {
    if (this.formularioInvalido || this.cargando()) return;

    this.error = null;
    this.cargando.set(true);
    this.nuevoUsuario.rol = this.rol();

    this.authService.registrar(this.nuevoUsuario).subscribe({
      next: () => {
        this.cargando.set(false);
        // Se registró, pero todavía no tiene sesión: lo mandamos a loguearse conservando el modo.
        this.router.navigate(['/login'], { queryParams: { registrado: '1', modo: this.modo() } });
      },
      error: (error) => {
        this.cargando.set(false);
        this.error = error?.error?.mensaje ?? 'No se pudo registrar el usuario. Probá de nuevo.';
      }
    });
  }
}