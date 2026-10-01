import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { App } from './app';
import { UsuariosService } from './servicios/usuario.service';
import { provideHttpClient } from '@angular/common/http';
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
describe('App', () => {
  const usuariosServiceMock = {
    obtenerUsuarios: jest.fn().mockReturnValue(of([])),
    crearUsuario: jest.fn().mockReturnValue(of({})),
  };


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: UsuariosService, useValue: usuariosServiceMock },
        provideHttpClient()
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

});