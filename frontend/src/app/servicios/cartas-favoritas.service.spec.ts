import { TestBed } from '@angular/core/testing';

import { CartasFavoritasService } from './cartas-favoritas.service';

describe('CartasFavoritasService', () => {
  let service: CartasFavoritasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartasFavoritasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
