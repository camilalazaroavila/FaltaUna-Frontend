import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CARTAS_MOCK } from '../modelos/cartas.mock';
import { BarajaService } from './baraja.service';

describe('BarajaService', () => {
  let servicio: BarajaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(BarajaService);
  });

  it('expone solo las cartas obtenidas como disponibles', async () => {
    const disponibles = await firstValueFrom(servicio.obtenerCartasDisponibles());

    expect(disponibles.length).toBeGreaterThanOrEqual(12);
    expect(disponibles.every((carta) => carta.obtenida)).toBe(true);
    expect(disponibles.length).toBe(CARTAS_MOCK.filter((carta) => carta.obtenida).length);
  });

  it('arranca sin baraja guardada', async () => {
    expect(await firstValueFrom(servicio.obtenerBaraja())).toEqual([]);
  });

  it('guarda la baraja y la devuelve en las lecturas siguientes', async () => {
    const baraja = CARTAS_MOCK.filter((carta) => carta.obtenida).slice(0, 12);

    const guardada = await firstValueFrom(servicio.guardarBaraja(baraja));

    expect(guardada.map((c) => c.id)).toEqual(baraja.map((c) => c.id));
    expect((await firstValueFrom(servicio.obtenerBaraja())).map((c) => c.id)).toEqual(
      baraja.map((c) => c.id),
    );
  });
});
