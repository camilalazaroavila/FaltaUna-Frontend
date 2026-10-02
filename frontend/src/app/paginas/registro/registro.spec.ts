import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
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
});