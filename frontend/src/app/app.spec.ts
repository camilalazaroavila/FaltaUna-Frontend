import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { App } from './app';
import { UsuariosService } from './servicios/usuario.service';

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
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
