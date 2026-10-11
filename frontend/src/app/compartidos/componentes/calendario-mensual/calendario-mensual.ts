import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { aIso, desdeIso } from '../../utilidades/fechas';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Calendario de un mes con navegación, para elegir UNA fecha.
 * El valor es `YYYY-MM-DD` ('' si no hay nada elegido). Usalo con `[(valor)]`.
 * `min` deshabilita los días anteriores.
 */
@Component({
  selector: 'app-calendario-mensual',
  standalone: true,
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-56 rounded-md border border-borde-default bg-fondo-superficie p-3 font-interfaz text-xs text-texto-primario shadow-baja"
      role="group"
      [attr.aria-label]="etiquetaAccesible()"
    >
      <div class="mb-2 flex items-center justify-between">
        <span class="font-bold capitalize" aria-live="polite">{{ tituloMes() }}</span>
        <div class="flex gap-1">
          <button
            type="button"
            class="flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-fondo-elevado focus-visible:outline-2 focus-visible:outline-borde-foco"
            aria-label="Mes anterior"
            (click)="mover(-1)"
          >
            <ng-icon name="phosphorCaretDownFill" class="size-3 rotate-90" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-fondo-elevado focus-visible:outline-2 focus-visible:outline-borde-foco"
            aria-label="Mes siguiente"
            (click)="mover(1)"
          >
            <ng-icon name="phosphorCaretDownFill" class="size-3 -rotate-90" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-y-0.5 text-center">
        @for (d of diasSemana; track $index) {
          <span class="py-1 font-bold text-texto-secundario" aria-hidden="true">{{ d }}</span>
        }
        @for (dia of dias(); track dia.iso) {
          <button
            type="button"
            class="mx-auto flex size-7 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-borde-foco"
            [class]="claseDia(dia)"
            [disabled]="dia.deshabilitado"
            [attr.aria-pressed]="dia.seleccionado"
            [attr.aria-label]="dia.etiqueta"
            (click)="elegir(dia.iso)"
          >
            {{ dia.numero }}
          </button>
        }
      </div>

      <div class="mt-2 text-right">
        <button
          type="button"
          class="cursor-pointer font-bold text-marca-primaria hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="hoyDeshabilitado()"
          (click)="elegir(hoyIso)"
        >
          Hoy
        </button>
      </div>
    </div>
  `,
})
export class CalendarioMensual {
  readonly valor = model('');
  readonly min = input<string | null>(null);
  readonly etiquetaAccesible = input('Calendario');

  protected readonly diasSemana = DIAS_SEMANA;
  protected readonly hoyIso = aIso(new Date());

  /** Primer día del mes que se está mirando. */
  private readonly mes = signal(this.mesInicial());

  protected readonly tituloMes = computed(() =>
    new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(this.mes()),
  );

  protected readonly hoyDeshabilitado = computed(() => this.estaBloqueado(this.hoyIso));

  protected readonly dias = computed(() => {
    const primero = this.mes();
    // Lunes = 0 … Domingo = 6
    const desplazamiento = (primero.getDay() + 6) % 7;
    const inicio = new Date(primero.getFullYear(), primero.getMonth(), 1 - desplazamiento);
    const formato = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' });

    return Array.from({ length: 42 }, (_, i) => {
      const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      const iso = aIso(fecha);
      return {
        iso,
        numero: fecha.getDate(),
        delMes: fecha.getMonth() === primero.getMonth(),
        deshabilitado: this.estaBloqueado(iso),
        seleccionado: iso === this.valor(),
        hoy: iso === this.hoyIso,
        etiqueta: formato.format(fecha),
      };
    });
  });

  protected mover(delta: number): void {
    const actual = this.mes();
    this.mes.set(new Date(actual.getFullYear(), actual.getMonth() + delta, 1));
  }

  protected elegir(iso: string): void {
    if (this.estaBloqueado(iso)) return;
    this.valor.set(iso);
    this.mes.set(new Date(desdeIso(iso).getFullYear(), desdeIso(iso).getMonth(), 1));
  }

  protected claseDia(dia: { delMes: boolean; seleccionado: boolean; hoy: boolean; deshabilitado: boolean }): string {
    if (dia.seleccionado) return 'bg-texto-primario font-bold text-texto-sobre-oscuro';
    if (dia.deshabilitado) return 'cursor-not-allowed text-texto-apagado opacity-40';
    const base = dia.delMes ? 'text-texto-primario' : 'text-texto-apagado';
    const hoy = dia.hoy ? 'border border-texto-primario' : '';
    return `cursor-pointer hover:bg-fondo-elevado ${base} ${hoy}`;
  }

  private estaBloqueado(iso: string): boolean {
    const min = this.min();
    return !!min && iso < min;
  }

  private mesInicial(): Date {
    const base = this.valor() ? desdeIso(this.valor()) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }
}