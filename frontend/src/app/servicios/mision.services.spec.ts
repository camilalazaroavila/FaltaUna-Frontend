import { TestBed } from '@angular/core/testing';

import { faltantesPity } from '@modelos/misiones.model';
import { MisionesService } from './mision.services';

describe('MisionesService', () => {
  let servicio: MisionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(MisionesService);
  });

  it('filtra las misiones por periodicidad', () => {
    const diarias = servicio.misionesDe('diaria');
    expect(diarias.length).toBeGreaterThan(0);
    expect(diarias.every((m) => m.periodicidad === 'diaria')).toBe(true);
  });

  it('la misión diaria "Abrí 1 sobre" recompensa con un sobre genérico', () => {
    const mision = servicio.misiones().find((m) => m.titulo === 'Abrí 1 sobre');
    expect(mision?.recompensa).toEqual({ tipo: 'generico' });
  });

  it('los sobres de marca del PT System declaran su categoría', () => {
    const marcas = servicio.pity().filter((p) => p.sobre.tipo === 'marca');
    expect(marcas.length).toBeGreaterThan(0);
    expect(marcas.every((p) => p.sobre.tipo === 'marca' && !!p.sobre.categoria)).toBe(true);
  });

  it('reclama una misión completada y la marca como reclamada', (hecho) => {
    const completada = servicio.misiones().find((m) => m.estado === 'completada')!;

    servicio.reclamar(completada.id).subscribe((m) => {
      expect(m.estado).toBe('reclamada');
      expect(servicio.misiones().find((x) => x.id === completada.id)?.estado).toBe('reclamada');
      hecho();
    });
  });

  it('rechaza reclamar una misión en curso', (hecho) => {
    const enCurso = servicio.misiones().find((m) => m.estado === 'en_curso')!;

    servicio.reclamar(enCurso.id).subscribe({
      error: (e: Error) => {
        expect(e.message).toContain('todavía');
        hecho();
      },
    });
  });

  it('rechaza reclamar una misión inexistente', (hecho) => {
    servicio.reclamar(9999).subscribe({ error: () => hecho() });
  });

  it('ordena el PT System de menos a más faltantes', () => {
    const faltantes = servicio.pityPorCercania().map(faltantesPity);
    expect(faltantes).toEqual([...faltantes].sort((a, b) => a - b));
  });
});