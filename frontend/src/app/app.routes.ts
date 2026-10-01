import { Routes } from '@angular/router';
import { rolGuard } from './guardias/rol.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    loadComponent: () =>
      import('./paginas/login/login').then((m) => m.Login)
  },

  {
    path: 'registro',
    loadComponent: () =>
      import('./paginas/registro/registro').then((m) => m.Registro)
  },

  {
    path: 'usuario',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Usuario'] },
    loadComponent: () =>
      import('./paginas/usuario-dashboard/usuario-dashboard')
        .then((m) => m.UsuarioDashboard)
  },

  {
    path: 'empleado',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Empleado'] },
    loadComponent: () =>
      import('./paginas/empleado-dashboard/empleado-dashboard')
        .then((m) => m.EmpleadoDashboard)
  },

  {
    path: 'empresa',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Empresa'] },
    loadComponent: () =>
      import('./paginas/empresa-dashboard/empresa-dashboard')
        .then((m) => m.EmpresaDashboard)
  },

  {
    path: 'admin',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Admin'] },
    loadComponent: () =>
      import('./paginas/admin-dashboard/admin-dashboard')
        .then((m) => m.AdminDashboard)
  },

  { path: '**', redirectTo: 'login' }
];