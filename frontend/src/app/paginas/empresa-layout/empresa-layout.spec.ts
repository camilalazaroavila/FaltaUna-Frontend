import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { AuthService } from '@servicios/auth.service';
import { EmpresaLayout } from './empresa-layout';

type LayoutConDestino = { destinoLogo: () => string | null };

describe('EmpresaLayout · destino del logo', () => {
  const crear = (url: string): LayoutConDestino => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { url, events: EMPTY } },
        {
          provide: AuthService,
          useValue: { usuarioActual: () => ({ nombreUsuario: 'ACME' }), logout: () => undefined },
        },
      ],
    });

    return TestBed.runInInjectionContext(() => new EmpresaLayout()) as unknown as LayoutConDestino;
  };

  it('deja el logo inerte en todos los pasos del alta', () => {
    const pasos = [
      '/empresa',
      '/empresa/album/pago/exito',
      '/empresa/album/pago/aprobado',
      '/empresa/album/crear/marca',
      '/empresa/album/crear/identidad',
    ];

    for (const paso of pasos) {
      TestBed.resetTestingModule();
      expect(crear(paso).destinoLogo()).toBeNull();
    }
  });

  it('lleva al panel cuando ya se está dentro del panel', () => {
    TestBed.resetTestingModule();
    expect(crear('/empresa/panel/estadisticas').destinoLogo()).toBe('/empresa/panel');
  });

  it('habilita el logo recién en el paso final del alta (álbum creado)', () => {
    TestBed.resetTestingModule();
    expect(crear('/empresa/album/crear/listo').destinoLogo()).toBe('/empresa/panel');
  });
});
