import { Routes } from '@angular/router';
import { rolGuard } from './guardias/rol.guard';

/**
 * Rutas de la aplicación.
 *
 * El flujo real de usuarios entra por `login`; los dashboards quedan detrás de
 * `rolGuard`, que valida contra el rol del token. La ruta raíz redirige a
 * `login` porque todavía no hay landing pública: la pantalla de inicio se
 * construye en una tanda posterior.
 *
 * `componentes` es el banco de pruebas visual del sistema de diseño y no forma
 * parte del flujo de producto.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    title: 'Ingresar · Falta Una',
    loadComponent: () => import('./paginas/login/login').then((m) => m.Login),
  },

  {
    path: 'registro',
    title: 'Crear usuario · Falta Una',
    loadComponent: () => import('./paginas/registro/registro').then((m) => m.Registro),
  },

  {
    path: 'usuario',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Usuario'] },
    loadComponent: () =>
      import('./paginas/usuario-dashboard/usuario-dashboard').then((m) => m.UsuarioDashboard),
  },

  {
    path: 'empleado',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Empleado'] },
    loadComponent: () =>
      import('./paginas/empleado-dashboard/empleado-dashboard').then((m) => m.EmpleadoDashboard),
  },

  {
    path: 'empresa',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Empresa'] },
    loadComponent: () =>
      import('./paginas/empresa-dashboard/empresa-dashboard').then((m) => m.EmpresaDashboard),
  },

  {
    path: 'admin',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Admin'] },
    loadComponent: () =>
      import('./paginas/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
  },

  {
    path: 'componentes',
    title: 'Galería de componentes · Falta Una',
    loadComponent: () =>
      import('./paginas/galeria-componentes/galeria-componentes').then(
        (m) => m.GaleriaComponentes,
      ),
  },

  { path: '**', redirectTo: 'login' },
];