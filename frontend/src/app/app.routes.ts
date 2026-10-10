import { Routes } from '@angular/router';
import { rolGuard } from './guardias/rol.guard';
import { pagoAprobadoGuard } from './guardias/pago-aprobado.guard';

/**
 * Rutas de la aplicación.
 *
 * El flujo real de usuarios entra por `login`; los dashboards quedan detrás de
 * `rolGuard`, que valida contra el rol del token. La ruta raíz es la landing
 * pública y desde ella se accede a `login` y `registro`.
 *
 * `componentes` es el banco de pruebas visual del sistema de diseño y no forma
 * parte del flujo de producto.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Falta Una · Partidos y cartas',
    loadComponent: () => import('./paginas/landing/landing').then((m) => m.Landing),
  },

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
    path: 'usuario/cupones',
    title: 'Mis cupones · Falta Una',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Usuario'] },
    loadComponent: () =>
      import('./paginas/usuario-cupones/usuario-cupones').then((m) => m.UsuarioCupones),
  },

  {
    path: 'empleado',
    title: 'Canje de cupones · Falta Una',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Empleado'] },
    loadComponent: () =>
      import('./paginas/empleado-dashboard/empleado-dashboard').then((m) => m.EmpleadoDashboard),
  },

  {
    // Rol Empresa: el layout aporta header y tema claro. Al entrar (/empresa)
    // se ve la elección de plan; el panel actual queda en /empresa/panel.
    path: 'empresa',
    canActivate: [rolGuard],
    data: { rolesPermitidos: ['Empresa'] },
    loadComponent: () =>
      import('./paginas/empresa-layout/empresa-layout').then((m) => m.EmpresaLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Elegí tu plan · Falta Una',
        loadComponent: () =>
          import('./paginas/empresa-planes/empresa-planes').then((m) => m.EmpresaPlanes),
      },
      {
        path: 'album/pago/:resultado',
        title: 'Estado del pago · Falta Una',
        loadComponent: () =>
          import(
            './paginas/empresa-pago-resultado/empresa-pago-resultado'
          ).then((m) => m.EmpresaPagoResultado),
      },
      {
        path: 'album/pago',
        pathMatch: 'full',
        redirectTo: 'album/pago/pendiente',
      },
      {
        // Pasos 3 a 5: solo con pago aprobado (pagoAprobadoGuard).
        path: 'album/crear',
        canActivate: [pagoAprobadoGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'marca' },
          {
            path: 'marca',
            title: 'Tu marca · Falta Una',
            loadComponent: () =>
              import('./paginas/empresa-album-marca/empresa-album-marca').then(
                (m) => m.EmpresaAlbumMarca,
              ),
          },
          {
            path: 'identidad',
            title: 'Qué te identifica · Falta Una',
            loadComponent: () =>
              import('./paginas/empresa-album-identidad/empresa-album-identidad').then(
                (m) => m.EmpresaAlbumIdentidad,
              ),
          },
          {
            path: 'listo',
            title: 'Álbum creado · Falta Una',
            loadComponent: () =>
              import('./paginas/empresa-album-exito/empresa-album-exito').then(
                (m) => m.EmpresaAlbumExito,
              ),
          },
        ],
      },
      {
        path: 'panel',
        title: 'Panel de empresa · Falta Una',
        loadComponent: () =>
          import('./paginas/empresa-dashboard/empresa-dashboard').then((m) => m.EmpresaDashboard),
      },
    ],
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