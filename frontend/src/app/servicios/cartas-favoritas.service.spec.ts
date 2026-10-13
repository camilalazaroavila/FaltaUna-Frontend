import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { of } from 'rxjs';
import { CartasFavoritasService } from './cartas-favoritas.service';

describe('CartasFavoritasService', () => {
  const apiFalso = 
  {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  };

  let servicio: CartasFavoritasService;

  beforeEach(() => {
    jest.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiFalso }],
    });
    servicio = TestBed.inject(CartasFavoritasService);
  });

  it('obtenerCartasFavoritas hace GET con la ruta correcta', () => {
    apiFalso.get.mockReturnValue(of([]));

    servicio.obtenerCartasFavoritas(1).subscribe();

    expect(apiFalso.get).toHaveBeenCalledWith('usuarios/1/cartas-favoritas');
  });

  it('agregarCartasFavoritas hace POST a la ruta del usuario y la carta', () => {
    apiFalso.post.mockReturnValue(of(undefined));

    servicio.agregarCartasFavoritas(1, 10).subscribe();

    expect(apiFalso.post).toHaveBeenCalledWith('1/10',{});
  });

  it('quitarCartasFavoritas hace DELETE a la ruta del usuario y la carta', () => {
    apiFalso.delete.mockReturnValue(of(undefined));

    servicio.quitarCartasFavoritas(1, 10).subscribe();

    expect(apiFalso.delete).toHaveBeenCalledWith('1/10');
  });
});
