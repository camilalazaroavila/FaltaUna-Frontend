
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxSonnerToaster } from 'ngx-sonner';
import { UsuariosService } from './servicios/usuario.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule, NgxSonnerToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}