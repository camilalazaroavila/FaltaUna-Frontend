import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxSonnerToaster } from 'ngx-sonner';
import { UsuariosService } from './servicios/usuario.service';
import { CrearUsuarioSolicitud } from './modelos/usuario.model';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [FormsModule, NgxSonnerToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {

  nombreUsuarioDisponible = signal<boolean | null>(null);
  emailDisponible = signal<boolean | null>(null);
  verificandoNombre = signal(false);
  verificandoEmail = signal(false);
  cargando = signal(false);

  private nombreUsuario$ = new Subject<string>();
  private email$ = new Subject<string>();
  private destruido$ = new Subject<void>();

  usuarios: any[] = [];

  nuevoUsuario: CrearUsuarioSolicitud = {
    nombreUsuario: '',
    email: '',
    password: '',
    rol: 'Usuario'
  };

  constructor(private usuariosService: UsuariosService) { }

  ngOnInit(): void {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (datos) => {
        console.log('Usuarios recibidos:', datos);
        this.usuarios = datos;
      },
      error: (error) => {
        console.error('Error al obtener usuarios:', error);
      }

    });
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

  registrarUsuario(): void {
    this.nombreUsuarioDisponible.set(null);
    this.emailDisponible.set(null);
    this.cargando.set(true);

    this.usuariosService.crearUsuario(this.nuevoUsuario).subscribe({
      next: (usuarioCreado) => {
        this.cargando.set(false);
        console.log('Usuario creado:', usuarioCreado);
        alert('Usuario registrado correctamente');

        this.nuevoUsuario = {
          nombreUsuario: '',
          email: '',
          password: '',
          rol: 'Usuario'
        };

        this.ngOnInit();
      },
      error: (error) => {
        this.cargando.set(false);
        console.error('Detalle del error 400 desde .NET:', error.error);
        alert('No se pudo registrar el usuario');
      }
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


  get errorEmail(): string | null {
    const emailUsuario = this.nuevoUsuario.email;
    if (!emailUsuario) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailUsuario) ? null : 'El email no tiene un formato válido';
  }
}