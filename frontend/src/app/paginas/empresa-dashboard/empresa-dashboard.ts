import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-empresa-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './empresa-dashboard.html'
})
export class EmpresaDashboard {

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}