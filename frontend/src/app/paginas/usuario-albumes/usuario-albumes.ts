import { RouterLink } from '@angular/router';
import { Boton } from '../../compartidos/componentes/boton/boton';
import { EncabezadoAlbum } from '../../compartidos/componentes/encabezado-album/encabezado-album';
import { GrillaCartasAlbum } from '../../compartidos/componentes/grilla-cartas-album/grilla-cartas-album';
import { Header } from '../../compartidos/componentes/header/header';
import { Component } from '@angular/core';

@Component({
  selector: 'app-usuario-albumes',
  imports: [RouterLink, Header, Boton, EncabezadoAlbum, GrillaCartasAlbum],
  templateUrl: './usuario-albumes.html',
})
export class UsuarioAlbumes {

}
