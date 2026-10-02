import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../servicios/usuario.service';
import { CrearUsuarioSolicitud, UsuarioRespuesta } from '../../modelos/usuario.model';

/**
 * Pantalla de alta de usuario.
 *
 * Este componente es una *migración literal* del markup que vivía en
 * `app.html`: conserva su diseño, sus clases y sus colores hardcodeados para no
 * alterar una pantalla ya aprobada.
 *
 * TODO: retirar `#hex` y migrar a tokens semánticos (`fondo-app`,
 * `marca-primaria`, `texto-secundario`, `rounded-*`). La paleta actual no
 * corresponde al sistema de diseño de 3 capas: usa `#123f46` y `#f05b52`,
 * ausentes de `styles.css`.
 */
@Component({
  selector: 'app-registro',
  imports: [FormsModule],
  templateUrl: './registro.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro implements OnInit {
  private readonly usuariosService = inject(UsuariosService);

  protected readonly usuarios = signal<UsuarioRespuesta[]>([]);

  protected nuevoUsuario: CrearUsuarioSolicitud = {
    nombreUsuario: '',
    email: '',
    password: '',
  };

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  protected registrarUsuario(): void {
    this.usuariosService.crearUsuario(this.nuevoUsuario).subscribe({
      next: (usuarioCreado) => {
        console.log('Usuario creado:', usuarioCreado);
        alert('Usuario registrado correctamente');

        this.nuevoUsuario = { nombreUsuario: '', email: '', password: '' };

        this.cargarUsuarios();
      },
      error: (error) => {
        console.error('Detalle del error 400 desde .NET:', error.error);
        alert('No se pudo registrar el usuario');
      },
    });
  }

  private cargarUsuarios(): void {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (datos) => this.usuarios.set(datos),
      error: (error) => console.error('Error al obtener usuarios:', error),
    });
  }
}