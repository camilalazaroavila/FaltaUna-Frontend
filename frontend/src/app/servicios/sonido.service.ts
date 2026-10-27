import { Injectable } from '@angular/core';

/**
 * Rutas a los efectos de sonido de partida en `public/sonidos/partida-sonidos/`.
 * No se incluye `cartoon_music-video-game-collect-item-550420.mp3` por pedido explícito.
 */
export const SONIDOS_PARTIDA = {
  /** Se dispara al levantar o agarrar una carta de la mano para jugarla. */
  agarrarCarta: '/sonidos/partida-sonidos/agarrar una carta.mp3',

  /** Se dispara al colocar o apoyar una carta en un slot de la mesa. */
  apoyarCarta: '/sonidos/partida-sonidos/apoyar la carta.mp3',

  /** Clic en botones (global con prioridad y mayor presencia en la partida). */
  boton: '/sonidos/partida-sonidos/botones.mp3',

  /** Se dispara cuando las cartas se revelan y se dan vuelta al comenzar el conteo. */
  darVueltaCartas: '/sonidos/partida-sonidos/efecto para cuando las cartas se dan vuelta.mp3',

  /** Se dispara cuando una carta suma su propio poder con la burbuja flotante. */
  cartaSumaPoder: '/sonidos/partida-sonidos/Efecto para cuando una carta se suma su propio poder.mp3',

  /** Se dispara cuando una carta aumenta su poder por efecto o habilidad. */
  powerUp: '/sonidos/partida-sonidos/power up.mp3',

  /** Se dispara cuando una carta reduce su poder por efecto o habilidad. */
  powerDown: '/sonidos/partida-sonidos/power down.mp3',

  /** Se dispara cuando la zona cambia de lugar y rota. */
  rotarZona: '/sonidos/partida-sonidos/Efecto de sonido cuando la zona cambia de lugar.mp3',

  /** Se dispara al cargar/llenar la barra de puntos al final de la animación de los puntos. */
  cargarBarraPuntos: '/sonidos/partida-sonidos/sonido cuando carga la barra de puntos.mp3',

  /** Se dispara en la pantalla de resultado ante una victoria (únicamente al mostrar el cartel). */
  victoria: '/sonidos/partida-sonidos/victoria.mp3',

  /** Se dispara en la pantalla de resultado ante una derrota (únicamente al mostrar el cartel). */
  derrota: '/sonidos/partida-sonidos/cuando termina la partida en derrota.mp3',

  /** Música ambiental en loop durante la partida con volumen bajo. */
  musicaFondo: '/sonidos/partida-sonidos/Fondo para la partida con volumen bajo.mp3',

  /** Se dispara al completar o reclamar una misión. */
  misionCompletada: '/sonidos/partida-sonidos/cuando completaste una mision.mp3',
} as const;

export type SonidoPartidaClave = keyof typeof SONIDOS_PARTIDA;

/**
 * Reproduce efectos de sonido cortos (mp3 en `public/sonidos/`).
 *
 * Cada archivo se precarga una sola vez. Si se vuelve a disparar mientras ya suena,
 * clona el elemento de audio para permitir superposición polifónica sin cortes.
 * Nunca lanza errores: si el navegador bloquea el audio o no existe `Audio` (tests, SSR),
 * simplemente no suena.
 */
@Injectable({ providedIn: 'root' })
export class SonidoService {
  private readonly cache = new Map<string, HTMLAudioElement>();
  private musicaFondoAudio?: HTMLAudioElement;

  constructor() {
    this.iniciarEscuchaBotonesGlobal();
  }

  /**
   * Escucha global de clics en botones de toda la aplicación, dando mayor presencia
   * y volumen a los botones dentro de la partida.
   */
  private iniciarEscuchaBotonesGlobal(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.addEventListener(
      'click',
      (evento) => {
        const objetivo = evento.target as HTMLElement | null;
        if (!objetivo) {
          return;
        }

        const boton = objetivo.closest<HTMLElement>(
          'button, [role="button"], a.btn, a[role="button"], input[type="button"], input[type="submit"]',
        );

        if (!boton) {
          return;
        }

        if (
          (boton as HTMLButtonElement).disabled ||
          boton.getAttribute('aria-disabled') === 'true' ||
          boton.classList.contains('disabled') ||
          boton.getAttribute('disabled') !== null
        ) {
          return;
        }

        // Mayor presencia en la partida (pedido explícito del usuario)
        const enPartida = Boolean(
          boton.closest('.partida-activa, app-tablero, app-pantalla-resultado, .area-tablero'),
        );
        const volumen = enPartida ? 0.65 : 0.4;

        this.reproducir(SONIDOS_PARTIDA.boton, volumen);
      },
      { capture: true, passive: true },
    );
  }

  /** Inicia la música de fondo en loop para la partida a volumen bajo. */
  iniciarMusicaFondo(volumen = 0.18): void {
    if (typeof Audio === 'undefined') {
      return;
    }

    try {
      if (!this.musicaFondoAudio) {
        this.musicaFondoAudio = new Audio(encodeURI(SONIDOS_PARTIDA.musicaFondo));
        this.musicaFondoAudio.loop = true;
      }
      this.musicaFondoAudio.volume = Math.max(0, Math.min(1, volumen));
      if (this.musicaFondoAudio.paused) {
        void this.musicaFondoAudio.play()?.catch(() => {
          // Si el navegador bloquea autoplay hasta el primer gesto del usuario
          const alInteractuar = () => {
            void this.musicaFondoAudio?.play()?.catch(() => undefined);
            window.removeEventListener('click', alInteractuar);
            window.removeEventListener('keydown', alInteractuar);
          };
          window.addEventListener('click', alInteractuar, { once: true });
          window.addEventListener('keydown', alInteractuar, { once: true });
        });
      }
    } catch {
      // Ignorar si no está disponible
    }
  }

  /** Modifica el volumen de la música de fondo en curso (ej. al atenuarla en fin de partida). */
  ajustarVolumenMusicaFondo(volumen: number): void {
    if (this.musicaFondoAudio) {
      this.musicaFondoAudio.volume = Math.max(0, Math.min(1, volumen));
    }
  }

  /** Detiene y reinicia la música ambiental de fondo. */
  detenerMusicaFondo(): void {
    if (this.musicaFondoAudio) {
      try {
        this.musicaFondoAudio.pause();
        this.musicaFondoAudio.currentTime = 0;
      } catch {
        // Ignorar
      }
    }
  }

  /** Descarga el archivo antes de necesitarlo, para que suene sin demora al primer click. */
  precargar(url: string): void {
    this.obtener(url);
  }

  /** Precarga en lote todos los efectos de la partida para eliminar latencia en las animaciones. */
  precargarSonidosPartida(): void {
    for (const ruta of Object.values(SONIDOS_PARTIDA)) {
      this.precargar(ruta);
    }
  }

  reproducir(url: string, volumen = 0.7): void {
    if (typeof Audio === 'undefined') {
      return;
    }

    const base = this.obtener(url);
    if (!base) {
      return;
    }

    try {
      const audio = base.paused ? base : (base.cloneNode(true) as HTMLAudioElement);
      audio.volume = Math.max(0, Math.min(1, volumen));
      audio.currentTime = 0;
      void audio.play()?.catch(() => undefined);
    } catch {
      // Sin audio disponible o bloqueo de autoplay: no pasa nada.
    }
  }

  private obtener(url: string): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') {
      return null;
    }

    const urlCodificada = encodeURI(url);
    let audio = this.cache.get(urlCodificada);

    if (!audio) {
      audio = new Audio(urlCodificada);
      audio.preload = 'auto';
      this.cache.set(urlCodificada, audio);
    }

    return audio;
  }
}