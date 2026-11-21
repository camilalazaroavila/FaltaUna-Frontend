import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BarraBonoMisiones } from '@compartidos/componentes/usuario/barra-bono-misiones/barra-bono-misiones';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import type { BonoDiarioMisiones } from '@modelos/misiones.model';

type ModoBloque = 'jugador' | 'empresa';

interface MuestraBono {
  readonly etiqueta: string;
  readonly bono: BonoDiarioMisiones;
}

/**
 * Sección de galería de `app-barra-bono-misiones` (caja protagonista de bono diario).
 */
@Component({
  selector: 'app-seccion-barra-bono-misiones',
  imports: [BarraBonoMisiones, TarjetaMuestra],
  templateUrl: './seccion-barra-bono-misiones.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionBarraBonoMisiones {
  protected readonly modos: readonly ModoBloque[] = ['jugador', 'empresa'];
  protected readonly ultimoReclamo = signal(false);
  protected readonly proximoReinicioEjemplo = new Date(
    Date.now() + 5 * 60 * 60 * 1000 + 13 * 60 * 1000,
  ).toISOString();

  private readonly recompensaBase = {
    id: 1,
    nombre: 'Sobre Bono Diario',
    tipo: 'GENERAL' as const,
    categoria: null,
    marca: null,
    logoUrl: null,
  };

  protected readonly muestras: readonly MuestraBono[] = [
    {
      etiqueta: 'En curso ("Premio" apagado)',
      bono: {
        totalRequeridas: 4,
        completadas: 1,
        disponible: false,
        reclamado: false,
        recompensa: this.recompensaBase,
        cantidadRecompensa: 1,
      },
    },
    {
      etiqueta: 'Disponible ("Reclamar" con energía y latido)',
      bono: {
        totalRequeridas: 4,
        completadas: 4,
        disponible: true,
        reclamado: false,
        recompensa: this.recompensaBase,
        cantidadRecompensa: 1,
      },
    },
    {
      etiqueta: 'Reclamado',
      bono: {
        totalRequeridas: 4,
        completadas: 4,
        disponible: false,
        reclamado: true,
        recompensa: this.recompensaBase,
        cantidadRecompensa: 1,
      },
    },
  ];
}
