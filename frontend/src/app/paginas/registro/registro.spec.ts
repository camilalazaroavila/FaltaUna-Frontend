import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { Registro } from './registro';
import { UsuariosService } from '../../servicios/usuario.service';

describe('Registro', () => {
  const usuariosServiceMock = {
    obtenerUsuarios: jest.fn().mockReturnValue(of([])),
    crearUsuario: jest.fn().mockReturnValue(of({})),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [
        { provide: UsuariosService, useValue: usuariosServiceMock },
        provideHttpClient(),
      ],
    }).compileComponents();
  });

  it('should create the page', () => {
    const fixture = TestBed.createComponent(Registro);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand title', () => {
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('FALTA UNA');
  });

  it('should request the user list on init', () => {
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();

    expect(usuariosServiceMock.obtenerUsuarios).toHaveBeenCalled();
  });
});