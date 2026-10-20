import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeaderEmpresa } from './header-empresa';
import { AuthService } from '@servicios/auth.service';

describe('HeaderEmpresa (logo)', () => {
  const crear = async (): Promise<ComponentFixture<HeaderEmpresa>> => {
    await TestBed.configureTestingModule({
      imports: [HeaderEmpresa],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { usuarioActual: () => ({ nombreUsuario: 'ACME' }) },
        },
      ],
    }).compileComponents();

    return TestBed.createComponent(HeaderEmpresa);
  };

  const logoEnlace = (fixture: ComponentFixture<HeaderEmpresa>): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(
      'a[aria-label="Ir al panel de empresa"]',
    );

  it('por defecto el logo queda inerte (sin enlace que interrumpa el alta)', async () => {
    const fixture = await crear();
    fixture.detectChanges();

    expect(logoEnlace(fixture)).toBeNull();
    // El imagotipo sigue visible aunque no navegue.
    expect((fixture.nativeElement as HTMLElement).querySelector('header img')).not.toBeNull();
  });

  it('con destino explícito el logo navega al destino indicado', async () => {
    const fixture = await crear();
    fixture.componentRef.setInput('destinoLogo', '/empresa/panel');
    fixture.detectChanges();

    const enlace = logoEnlace(fixture);
    expect(enlace).not.toBeNull();
    expect(enlace?.getAttribute('href')).toBe('/empresa/panel');
  });
});
