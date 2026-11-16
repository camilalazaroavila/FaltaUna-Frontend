import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

const MS_SEGUNDO = 1000;
const MS_MINUTO = 60 * MS_SEGUNDO;
const MS_HORA = 60 * MS_MINUTO;
const MS_DIA = 24 * MS_HORA;

/**
 * Formatea una duración restante usando siempre espacios y las dos unidades más grandes
 * (ej. "6 d 24 min", "5 h 13 min", "12 min", o segundos en el último minuto).
 */
export const formatearTiempoRestante = (restanteMs: number): string => {
  if (restanteMs <= 0) return '0 min';

  const dias = Math.floor(restanteMs / MS_DIA);
  const horas = Math.floor((restanteMs % MS_DIA) / MS_HORA);
  const minutos = Math.floor((restanteMs % MS_HORA) / MS_MINUTO);
  const segundos = Math.ceil((restanteMs % MS_MINUTO) / MS_SEGUNDO);

  if (dias > 0) {
    if (horas > 0) return `${dias} d ${horas} h`;
    if (minutos > 0) return `${dias} d ${minutos} min`;
    return `${dias} d`;
  }

  if (horas > 0) {
    return minutos > 0 ? `${horas} h ${minutos} min` : `${horas} h`;
  }

  if (minutos > 0) {
    return `${minutos} min`;
  }

  return `${Math.max(1, segundos)} s`;
};

/**
 * Chip de tiempo hasta el próximo reinicio de misiones (nombre a aprobar).
 *
 * Usa el `offsetRelojMs` del servidor para no depender del reloj local, se
 * actualiza cada minuto (o cada segundo en el último minuto), se pausa cuando
 * la pestaña está oculta y emite `reinicioAlcanzado` una sola vez al llegar a 0.
 */
@Component({
  selector: 'app-reinicio-misiones',
  imports: [NgIcon],
  templateUrl: './reinicio-misiones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
})
export class ReinicioMisiones {
  private readonly destroyRef = inject(DestroyRef);

  readonly proximoReinicioUtc = input<string | null>(null);
  readonly offsetRelojMs = input<number>(0);

  readonly reinicioAlcanzado = output<void>();

  private readonly ahoraServidorMs = signal<number>(Date.now());
  private readonly ultimoReinicioEmitido = signal<string | null>(null);
  private timerId: ReturnType<typeof setTimeout> | null = null;

  protected readonly objetivoMs = computed<number | null>(() => {
    const iso = this.proximoReinicioUtc();
    if (!iso) return null;
    const parsed = Date.parse(iso);
    return Number.isFinite(parsed) ? parsed : null;
  });

  protected readonly restanteMs = computed<number>(() => {
    const objetivo = this.objetivoMs();
    if (objetivo === null) return 0;
    return Math.max(0, objetivo - this.ahoraServidorMs());
  });

  protected readonly textoRestante = computed(() =>
    formatearTiempoRestante(this.restanteMs()),
  );

  constructor() {
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        this.limpiarTimer();
      } else {
        this.actualizarYProgramar();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    effect(() => {
      // Reprogramar cuando cambia la fecha objetivo o el desfase del servidor.
      this.objetivoMs();
      this.offsetRelojMs();
      this.actualizarYProgramar();
    });

    this.destroyRef.onDestroy(() => {
      this.limpiarTimer();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    });
  }

  private actualizarYProgramar(): void {
    this.limpiarTimer();
    const objetivo = this.objetivoMs();
    if (objetivo === null) return;

    const ahora = Date.now() + this.offsetRelojMs();
    this.ahoraServidorMs.set(ahora);

    const restante = objetivo - ahora;
    if (restante <= 0) {
      const iso = this.proximoReinicioUtc();
      if (iso && this.ultimoReinicioEmitido() !== iso) {
        this.ultimoReinicioEmitido.set(iso);
        this.reinicioAlcanzado.emit();
      }
      return;
    }

    if (typeof document !== 'undefined' && document.hidden) return;

    const paso = restante <= MS_MINUTO ? MS_SEGUNDO : MS_MINUTO;
    this.timerId = setTimeout(() => this.actualizarYProgramar(), paso);
  }

  private limpiarTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

