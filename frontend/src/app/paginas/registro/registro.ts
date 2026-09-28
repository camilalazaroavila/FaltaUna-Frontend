import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { UsuariosService } from '../../servicios/usuario.service';
import { CrearUsuarioSolicitud, ROLES_REGISTRABLES, Rol } from '../../modelos/usuario.model';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
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

  cargando = false;
  error: string | null = null;

  nombreUsuarioDisponible = signal<boolean | null>(null);
  emailDisponible = signal<boolean | null>(null);
  verificandoNombre = signal(false);
  verificandoEmail = signal(false);

  private nombreUsuario$ = new Subject<string>();
  private email$ = new Subject<string>();
  private destruido$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.nombreUsuario$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((valor) => {
        if (!valor || valor.trim().length < 3) { this.verificandoNombre.set(false); return of(null); }
        this.verificandoNombre.set(true);
        return this.usuariosService.verificarDisponibilidad({ nombreUsuario: valor })
          .pipe(catchError(() => of(null)));
      }),
      takeUntil(this.destruido$)
    ).subscribe((r) => {
      this.verificandoNombre.set(false);
      this.nombreUsuarioDisponible.set(r?.nombreUsuarioDisponible ?? null);
    });

    this.email$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((valor) => {
        if (!valor || !valor.includes('@')) { this.verificandoEmail.set(false); return of(null); }
        this.verificandoEmail.set(true);
        return this.usuariosService.verificarDisponibilidad({ email: valor })
          .pipe(catchError(() => of(null)));
      }),
      takeUntil(this.destruido$)
    ).subscribe((r) => {
      this.verificandoEmail.set(false);
      this.emailDisponible.set(r?.emailDisponible ?? null);
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

  get formularioInvalido(): boolean {
    return this.nombreUsuarioDisponible() === false || this.emailDisponible() === false;
  }

  seleccionarRol(rol: Rol): void {
    this.nuevoUsuario.rol = rol;
  }

  registrarUsuario(): void {
    if (this.formularioInvalido) return;

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

  get errorEmail(): string | null {
    const emailUsuario = this.nuevoUsuario.email;
    if (!emailUsuario) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailUsuario) ? null : 'El email no tiene un formato válido';
  }
}