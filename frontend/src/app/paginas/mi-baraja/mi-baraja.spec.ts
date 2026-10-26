import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { Carta, CategoriaCarta } from '@modelos/carta.model';
import { TAMANIO_BARAJA } from '@modelos/baraja.model';
import { CARTAS_MOCK } from '@modelos/cartas.mock';
import { BarajaService } from '@servicios/baraja.service';
import { MiBaraja } from './mi-baraja';
describe('MiBaraja', () => {
  let fixture: ComponentFixture<MiBaraja>;
  let componente: MiBaraja;
  const disponibles = () => CARTAS_MOCK.filter((carta) => carta.obtenida);
  const coleccion = (): Carta[] => componente['coleccion']();
  const seleccion = (): Carta[] => componente['seleccion']();
  const estado = () => componente['estado']();
  const comunes = () => coleccion().filter((carta) => carta.rareza === 'comun');
  const alternar = (carta: Carta): void => {
    componente['alternar'](carta);
    fixture.detectChanges();
  };
  const guardarBoton = () =>
    (fixture.nativeElement as HTMLElement).querySelector('.baraja__guardar') as HTMLButtonElement;
  beforeAll(() => {
    const original = console.warn.bind(console);
    jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('sanitizing unsafe URL value')) {
        return;
      }
      original(...(args as []));
    });
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiBaraja],
      providers: [
        provideRouter([]),
        {
          provide: BarajaService,
          useValue: {
            obtenerCartasDisponibles: () => of(disponibles()),
            obtenerMazoActual: () => of(null),
            guardarBaraja: (cartas: readonly Carta[]) => of([...cartas]),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MiBaraja);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('carga solo las cartas obtenidas y arranca con la baraja vacía', () => {
    expect(coleccion().length).toBe(disponibles().length);
    expect(coleccion().every((carta) => carta.obtenida)).toBe(true);
    expect(seleccion().length).toBe(0);
    expect(estado().faltantes).toBe(TAMANIO_BARAJA);
  });
  it('renderiza una carta seleccionable por carta y ningún casillero lleno', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('app-carta-seleccionable').length).toBe(disponibles().length);
    expect(host.querySelectorAll('.baraja__slot--lleno').length).toBe(0);
  });
  it('selecciona y deselecciona la misma carta al alternar', () => {
    const una = comunes()[0];
    alternar(una);
    expect(seleccion().map((c) => c.id)).toEqual([una.id]);
    expect(estado().total).toBe(1);
    alternar(una);
    expect(seleccion().length).toBe(0);
  });
  it('bloquea superar el tope de legendarias', () => {
    const base = coleccion().find((carta) => carta.rareza === 'legendaria') as Carta;
    coleccion()
      .filter((carta) => carta.rareza === 'legendaria')
      .forEach(alternar);
    const extra: Carta = { ...base, id: 'legendaria-extra' };
    componente['coleccion'].update((lista) => [...lista, extra]);
    fixture.detectChanges();
    alternar(extra);
    expect(seleccion().some((c) => c.id === 'legendaria-extra')).toBe(false);
    expect(componente['aviso']()).toContain('legendarias');
  });
  it('no permite pasar del máximo de cartas', () => {
    const validas = [
      ...comunes().slice(0, 5),
      ...coleccion().filter((carta) => carta.rareza === 'rara').slice(0, 4),
      ...coleccion().filter((carta) => carta.rareza === 'epicarta').slice(0, 2),
      ...coleccion().filter((carta) => carta.rareza === 'legendaria').slice(0, 1),
    ];
    validas.forEach(alternar);
    const rara = coleccion().find((carta) => carta.rareza === 'rara' && !seleccion().includes(carta)) as Carta;
    if (rara) {
      alternar(rara);
    }
    expect(seleccion().length).toBe(TAMANIO_BARAJA);
    expect(componente['aviso']()).toContain('12');
  });
  it('marca la baraja como completa y habilita el guardado con la composición válida', () => {
    [
      ...comunes().slice(0, 5),
      ...coleccion().filter((carta) => carta.rareza === 'rara').slice(0, 4),
      ...coleccion().filter((carta) => carta.rareza === 'epicarta').slice(0, 2),
      ...coleccion().filter((carta) => carta.rareza === 'legendaria').slice(0, 1),
    ].forEach(alternar);
    expect(estado().total).toBe(TAMANIO_BARAJA);
    expect(estado().puedeConfirmar).toBe(true);
    expect(guardarBoton().disabled).toBe(false);
  });
  it('guarda la baraja cuando está completa', () => {
    [
      ...comunes().slice(0, 5),
      ...coleccion().filter((carta) => carta.rareza === 'rara').slice(0, 4),
      ...coleccion().filter((carta) => carta.rareza === 'epicarta').slice(0, 2),
      ...coleccion().filter((carta) => carta.rareza === 'legendaria').slice(0, 1),
    ].forEach(alternar);
    componente['guardar']();
    fixture.detectChanges();
    expect(componente['guardando']()).toBe(false);
    expect(componente['guardado']()).toBe(true);
  });
  it('dibuja un casillero lleno por cada carta elegida', () => {
    alternar(comunes()[0]);
    alternar(comunes()[1]);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.baraja__slot--lleno').length,
    ).toBe(2);
  });
  it('vacía la baraja', () => {
    alternar(comunes()[0]);
    componente['vaciar']();
    fixture.detectChanges();
    expect(seleccion().length).toBe(0);
  });
  it('filtra el catálogo por búsqueda y por categoría', () => {
    componente['actualizarBusqueda']({ target: { value: 'danon' } } as unknown as Event);
    fixture.detectChanges();
    expect(componente['cartasFiltradas']().map((c) => c.nombre)).toEqual(['Danonino']);
    componente['actualizarBusqueda']({ target: { value: '' } } as unknown as Event);
    componente['toggleCategoria']('musica' satisfies CategoriaCarta);
    fixture.detectChanges();
    expect(componente['cartasFiltradas']().every((c) => c.categoria === 'musica')).toBe(true);
  });
  it('ordena el catálogo por rareza de mayor a menor por defecto', () => {
    const cartas = componente['cartasFiltradas']();
    expect(componente['orden']()).toBe('rareza-desc');
    expect(cartas[0].rareza).toBe('legendaria');
    expect(cartas[cartas.length - 1].rareza).toBe('comun');
  });
  it('filtra por rareza y se limpia al tocar de nuevo', () => {
    componente['toggleRareza']('legendaria');
    fixture.detectChanges();
    const filtradas = componente['cartasFiltradas']();
    expect(filtradas.length).toBeGreaterThan(0);
    expect(filtradas.every((carta) => carta.rareza === 'legendaria')).toBe(true);
    expect(componente['filtroRareza']()).toBe('legendaria');
    componente['toggleRareza']('legendaria');
    fixture.detectChanges();
    expect(componente['filtroRareza']()).toBeNull();
    expect(componente['cartasFiltradas']().length).toBe(coleccion().length);
  });
  it('cambia el orden del catálogo', () => {
    componente['cambiarOrden']({ target: { value: 'nombre-asc' } } as unknown as Event);
    fixture.detectChanges();
    expect(componente['orden']()).toBe('nombre-asc');
    const nombres = componente['cartasFiltradas']().map((carta) => carta.nombre);
    expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')));
  });
  it('selecciona con el clic de la carta sin abrir el detalle', () => {
    const boton = fixture.nativeElement.querySelector(
      'app-carta-seleccionable button',
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();
    expect(seleccion().length).toBe(1);
    expect(componente['cartaPopup']()).toBeNull();
  });
  it('abre y cierra el popup de detalle', () => {
    componente['abrirPopup'](comunes()[0]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-carta-popup')).not.toBeNull();
    componente['cerrarPopup']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-carta-popup')).toBeNull();
  });
});