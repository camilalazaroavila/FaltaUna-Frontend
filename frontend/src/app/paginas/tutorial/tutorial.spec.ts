import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TutorialServicio } from '@compartidos/componentes/tutorial/tutorial.servicio';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';

import { Tutorial } from './tutorial';

describe('Tutorial', () => {
  let servicio: PartidaServicio;
  let tutorial: TutorialServicio;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tutorial],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    servicio = TestBed.inject(PartidaServicio);
    tutorial = TestBed.inject(TutorialServicio);
  });

  it('prepara el escenario guionado y arranca el tutorial', () => {
    const fixture = TestBed.createComponent(Tutorial);
    fixture.detectChanges();

    expect(tutorial.activo()).toBe(true);
    expect(servicio.manoPropia()).toHaveLength(4);
    expect(servicio.turno()).toBe(1);
    expect(servicio.cuponesPropio()).toBe(3);
  });

  it('restaura la maqueta original al destruir la página', () => {
    const fixture = TestBed.createComponent(Tutorial);
    fixture.detectChanges();

    fixture.destroy();

    expect(servicio.manoPropia()).toHaveLength(5);
    expect(servicio.turno()).toBe(3);
    expect(servicio.cuponesPropio()).toBe(3);
  });
});
