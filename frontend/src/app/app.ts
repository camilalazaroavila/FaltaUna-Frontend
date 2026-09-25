import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from './servicios/usuario.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {

  usuarios: any[] = [];

  nuevoUsuario = {
    nombreUsuario: '',
    email: '',
    password: ''
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

  }

  registrarUsuario(): void {

    this.usuariosService.crearUsuario(this.nuevoUsuario).subscribe({
      next: (usuarioCreado) => {

        console.log('Usuario creado:', usuarioCreado);

        alert('Usuario registrado correctamente');

        this.nuevoUsuario = {
          nombreUsuario: '',
          email: '',
          password: ''
        };

      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        alert('No se pudo registrar el usuario');
      }
    });

  }
}