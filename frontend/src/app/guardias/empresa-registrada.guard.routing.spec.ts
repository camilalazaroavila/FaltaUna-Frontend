import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, Routes, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { empresaRegistradaGuard } from './empresa-registrada.guard';
import { AlbumesService } from '@servicios/albumes.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';

@Component({ standalone: true, template: '<p>planes</p>', imports: [RouterOutlet] })
class PlanesStub {}

@Component({ standalone: true, template: '<p>panel</p>' })
class PanelStub {}

const rutas: Routes = [
  {
    path: 'empresa',
    children: [
      { path: '', pathMatch: 'full', component: PlanesStub },
      { path: 'album/crear/marca', component: PanelStub },
      {
        path: 'panel',
        canActivate: [empresaRegistradaGuard],
        component: PanelStub,
      },
    ],
  },
];

describe('empresaRegistradaGuard (router real)', () => {
  const preparar = (
    obtenerMisAlbumes: () => unknown,
    opciones: { altaCompletada?: boolean; referenciaGuardada?: string | null } = {},
  ) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(rutas),
        { provide: AlbumesService, useValue: { obtenerMisAlbumes } },
        {
          provide: SuscripcionEstado,
          useValue: {
            ultimoPago: () => null,
            referenciaGuardada: () => opciones.referenciaGuardada ?? null,
            altaCompletada: () => opciones.altaCompletada ?? false,
            marcarAltaCompletada: jest.fn(),
            limpiarAltaCompletada: jest.fn(),
          },
        },
      ],
    });
  };

  it('no deja entrar al panel a una empresa sin álbum (vuelve a planes)', async () => {
    preparar(() => of([]));
    const harness = await RouterTestingHarness.create('/empresa');

    await harness.navigateByUrl('/empresa/panel');

    expect(TestBed.inject(Router).url).toBe('/empresa');
  });

  it('no deja entrar al panel ni siquiera con el indicador local si el backend no lista álbum', async () => {
    preparar(() => of([]), { altaCompletada: true });
    const harness = await RouterTestingHarness.create('/empresa');

    await harness.navigateByUrl('/empresa/panel');

    expect(TestBed.inject(Router).url).toBe('/empresa');
  });

  it('con pago iniciado redirige a crear el álbum en vez de al panel', async () => {
    preparar(() => of([]), { referenciaGuardada: 'REF-1' });
    const harness = await RouterTestingHarness.create('/empresa');

    await harness.navigateByUrl('/empresa/panel');

    expect(TestBed.inject(Router).url).toBe('/empresa/album/crear/marca');
  });

  it('deja entrar al panel a una empresa con álbum creado', async () => {
    preparar(() => of([{ id: 1 }]));
    const harness = await RouterTestingHarness.create('/empresa');

    await harness.navigateByUrl('/empresa/panel');

    expect(TestBed.inject(Router).url).toBe('/empresa/panel');
  });
});
