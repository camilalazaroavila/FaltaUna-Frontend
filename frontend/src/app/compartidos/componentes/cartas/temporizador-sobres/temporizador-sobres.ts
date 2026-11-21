import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface FormatoTiempo {
  readonly horas: string;
  readonly minutos: string;
  readonly segundos: string;
  readonly textoLegible: string;
}

export interface SlotSobreTemporizador {
  readonly indice: number;
  readonly etiqueta: string;
  readonly estado: 'listo' | 'cargando' | 'en_espera';
  readonly porcentaje: number;
  readonly textoEstado: string;
  readonly tiempoLegible: string;
}

/**
 * Temporizador accesible para la llegada del próximo sobre diario.
 *
 * Sincronizado estrictamente con los datos de fecha del servidor (`proximaRecarga`).
 * Si el backend no envía fecha o ya hay sobres disponibles, presenta un estado neutro
 * o informativo sin inventar cuentas regresivas falsas en el cliente.
 *
 * Características:
 * - Cuenta regresiva HH:MM:SS sincronizada con la fecha provista por el backend.
 * - Barra de progreso visual por cada sobre diario (slots individuales con porcentaje).
 * - Pausa cuando la pestaña está oculta (`visibilitychange`) y se resincroniza al volver.
 * - Limpia inmediatamente el timer al destruirse el componente.
 * - Al llegar a 0, emite `tiempoAgotado` para que el contenedor recargue del backend.
 * - Accesibilidad: anuncie con `aria-live` solo en momentos clave y mantenga `aria-label` legible.
 */
@Component({
  selector: 'app-temporizador-sobres',
  standalone: true,
  templateUrl: './temporizador-sobres.html',
  styleUrl: './temporizador-sobres.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporizadorSobres {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly esNavegador = isPlatformBrowser(this.platformId);

  /** Fecha ISO de la próxima recarga provista por el backend (ej: "2026-11-12T04:00:00Z"). */
  readonly proximaRecarga = input<string | null | undefined>(null);

  /** Cantidad actual de sobres gratis listos para abrir. */
  readonly sobresDisponibles = input<number>(0);

  /** Cantidad máxima de cargas posibles. */
  readonly sobresMaximos = input<number>(2);

  /** Horas por carga de cada sobre (por contrato de backend son 12 hs). */
  readonly duracionCicloHoras = input<number>(12);

  /** Estado de carga de la petición de sobres. */
  readonly cargando = input<boolean>(false);

  /** Estado de error al obtener los sobres diarios. */
  readonly error = input<string | null>(null);

  /** Notifica al contenedor cuando el reloj llega a 0 para que vuelva a consultar a la API. */
  readonly tiempoAgotado = output<void>();

  // Segundos restantes calculados contra la hora actual
  protected readonly segundosRestantes = signal<number | null>(null);

  // Mensaje para lectores de pantalla solo en eventos clave
  protected readonly mensajeAriaLive = signal<string>('');

  private timerId: ReturnType<typeof setInterval> | null = null;
  private yaDisparoCero = false;

  constructor() {
    effect(() => {
      const fechaIso = this.proximaRecarga();
      const disponibles = this.sobresDisponibles();
      const maximos = this.sobresMaximos();

      this.detenerTimer();
      this.yaDisparoCero = false;

      // Si tiene el tope de sobres disponibles, no hay cuenta regresiva
      if (disponibles >= maximos || !fechaIso) {
        this.segundosRestantes.set(null);
        return;
      }

      this.actualizarDiferencia(fechaIso);
      this.iniciarTimer();
    });

    if (this.esNavegador) {
      const alCambiarVisibilidad = () => {
        if (document.hidden) {
          this.detenerTimer();
        } else {
          const fechaIso = this.proximaRecarga();
          if (fechaIso && this.sobresDisponibles() < this.sobresMaximos()) {
            this.actualizarDiferencia(fechaIso);
            this.iniciarTimer();
          }
        }
      };

      document.addEventListener('visibilitychange', alCambiarVisibilidad);
      this.destroyRef.onDestroy(() => {
        this.detenerTimer();
        document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      });
    }
  }

  protected readonly formato = computed<FormatoTiempo | null>(() => {
    const seg = this.segundosRestantes();
    if (seg === null || seg <= 0) {
      return null;
    }

    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    const s = seg % 60;

    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');

    const partes: string[] = [];
    if (h > 0) partes.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
    if (m > 0 || h > 0) partes.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
    partes.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`);

    return {
      horas: hh,
      minutos: mm,
      segundos: ss,
      textoLegible: `Próximo sobre disponible en ${partes.join(' y ')}`,
    };
  });

  /** Información visual y progreso de barra timer para cada sobre individual. */
  readonly slotsSobres = computed<readonly SlotSobreTemporizador[]>(() => {
    const max = Math.max(1, this.sobresMaximos());
    const disp = Math.max(0, this.sobresDisponibles());
    const segRestantes = this.segundosRestantes();
    const duracionSegundos = Math.max(1, this.duracionCicloHoras() * 3600);

    const slots: SlotSobreTemporizador[] = [];

    for (let i = 0; i < max; i++) {
      const numSobre = i + 1;
      const etiqueta = `Sobre ${numSobre}`;

      if (i < disp) {
        slots.push({
          indice: i,
          etiqueta,
          estado: 'listo',
          porcentaje: 100,
          textoEstado: '¡Listo!',
          tiempoLegible: '¡Listo!',
        });
      } else if (i === disp) {
        if (segRestantes !== null && segRestantes > 0) {
          const transcurridos = Math.max(0, duracionSegundos - segRestantes);
          const pct = Math.min(100, Math.max(1, Math.round((transcurridos / duracionSegundos) * 100)));

          slots.push({
            indice: i,
            etiqueta,
            estado: 'cargando',
            porcentaje: pct,
            textoEstado: 'Cargando',
            tiempoLegible: 'Cargando',
          });
        } else if (segRestantes === 0) {
          slots.push({
            indice: i,
            etiqueta,
            estado: 'listo',
            porcentaje: 100,
            textoEstado: '¡Listo!',
            tiempoLegible: '¡Listo!',
          });
        } else {
          slots.push({
            indice: i,
            etiqueta,
            estado: 'en_espera',
            porcentaje: 0,
            textoEstado: 'En espera',
            tiempoLegible: 'En espera',
          });
        }
      } else {
        slots.push({
          indice: i,
          etiqueta,
          estado: 'en_espera',
          porcentaje: 0,
          textoEstado: 'En espera',
          tiempoLegible: 'En espera',
        });
      }
    }

    return slots;
  });

  private iniciarTimer(): void {
    if (!this.esNavegador || this.timerId) return;

    this.timerId = setInterval(() => {
      const fechaIso = this.proximaRecarga();
      if (!fechaIso) {
        this.detenerTimer();
        return;
      }

      const restante = this.calcularSegundosHasta(fechaIso);
      if (restante <= 0) {
        this.segundosRestantes.set(0);
        this.detenerTimer();
        if (!this.yaDisparoCero) {
          this.yaDisparoCero = true;
          this.mensajeAriaLive.set('¡Tu próximo sobre gratuito ya está disponible!');
          this.tiempoAgotado.emit();
        }
      } else {
        this.segundosRestantes.set(restante);
      }
    }, 1000);
  }

  private detenerTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private actualizarDiferencia(fechaIso: string): void {
    const restante = this.calcularSegundosHasta(fechaIso);
    if (restante <= 0) {
      this.segundosRestantes.set(0);
      this.detenerTimer();
      if (!this.yaDisparoCero) {
        this.yaDisparoCero = true;
        this.mensajeAriaLive.set('¡Tu próximo sobre gratuito ya está disponible!');
        this.tiempoAgotado.emit();
      }
    } else {
      this.segundosRestantes.set(restante);
    }
  }

  private calcularSegundosHasta(fechaIso: string): number {
    const destinoMs = new Date(fechaIso).getTime();
    if (Number.isNaN(destinoMs)) {
      return 0;
    }
    const ahoraMs = Date.now();
    return Math.max(0, Math.floor((destinoMs - ahoraMs) / 1000));
  }
}
