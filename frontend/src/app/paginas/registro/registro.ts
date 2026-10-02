import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { Subject, of, debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs';
import { AuthService } from '../../servicios/auth.service';
import { CrearUsuarioSolicitud, ROLES_REGISTRABLES, Rol } from '../../modelos/usuario.model';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink, NgxSonnerToaster],
  templateUrl: './registro.html'
})
export class Registro implements OnInit, OnDestroy {

  roles = ROLES_REGISTRABLES;

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

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

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

  seleccionarRol(rol: Rol): void {
    this.nuevoUsuario.rol = rol;
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

    this.authService.registrar(this.nuevoUsuario).subscribe({
      next: () => {
        this.cargando.set(false);
        // Se registró, pero todavía no tiene sesión: lo mandamos a loguearse.
        this.router.navigate(['/login'], { queryParams: { registrado: '1' } });
      },
      error: (error) => {
        this.cargando.set(false);
        this.error = error?.error?.mensaje ?? 'No se pudo registrar el usuario. Probá de nuevo.';
      }
    });
  }
}