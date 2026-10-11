import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Registro } from './registro';

/**
 * El alta de usuario con validación JWT, disponibilidad de nombre y email en
 * tiempo real y control de roles viene de `main` (`feature/login` +
 * `validacion`). Este archivo solo verifica que el componente arranque; el
 * comportamiento queda cubierto por los specs de `AuthService` y del backend.
 */
describe('Registro', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the page', () => {
    const fixture = TestBed.createComponent(Registro);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('deriva el rol real del modo de la URL sin selector de cuenta', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ modo: 'empresa' }) },
            queryParamMap: of(convertToParamMap({ modo: 'empresa' })),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Registro);
    const componente = fixture.componentInstance as unknown as { rol(): string };

    expect(componente.rol()).toBe('Empresa');
    expect(fixture.nativeElement.textContent).not.toContain('Tipo de cuenta');
  });
});