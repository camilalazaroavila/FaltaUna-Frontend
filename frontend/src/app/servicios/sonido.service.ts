import { Injectable } from '@angular/core';

/**
 * Rutas a los efectos de sonido de partida en `public/sonidos/partida-sonidos/`.
 * No se incluye `cartoon_music-video-game-collect-item-550420.mp3` por pedido explícito.
 */
export const SONIDOS_PARTIDA = {
  /** Se dispara al colocar o apoyar una carta en un slot de la mesa. */
  apoyarCarta: '/sonidos/partida-sonidos/apoyar la carta.mp3',

  /** Se dispara cuando las cartas se revelan y se dan vuelta al comenzar el conteo. */
  darVueltaCartas: '/sonidos/partida-sonidos/efecto para cuando las cartas se dan vuelta.mp3',

  /** Se dispara cuando una carta suma su propio poder con la burbuja flotante. */
  cartaSumaPoder: '/sonidos/partida-sonidos/Efecto para cuando una carta se suma su propio poder.mp3',

  /** Se dispara en cada impacto de poder cuando el puntaje de la zona se actualiza. */
  sumarPuntosAnimacion: '/sonidos/partida-sonidos/animacion de sumar puntos 2.mp3',

  /** Se dispara al transferir los puntos finales a la barra de puntos. */
  sumarPuntos: '/sonidos/partida-sonidos/efecto de sonido de sumar puntos.mp3',

  /** Se dispara cuando la zona cambia de lugar y rota. */
  rotarZona: '/sonidos/partida-sonidos/Efecto de sonido cuando la zona cambia de lugar.mp3',

  /** Se dispara al concluir la partida (pantalla de victoria o derrota). */
  finPartida: '/sonidos/partida-sonidos/cuando termina la partida.mp3',

  /** Se dispara en la celebración de victoria con confeti (triunfo heroico). */
  bonusVictoria: '/sonidos/partida-sonidos/cartoon_music-video-game-bonus-retro-550418.mp3',

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