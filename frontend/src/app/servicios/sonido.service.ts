import { Injectable } from '@angular/core';

/**
 * Reproduce efectos de sonido cortos (mp3 en `public/sonidos/`).
 *
 * Cada archivo se precarga una sola vez y, si se vuelve a disparar mientras suena,
 * arranca de nuevo desde el principio. Nunca lanza errores: si el navegador bloquea el
 * audio o no existe `Audio` (tests, SSR), simplemente no suena.
 */
@Injectable({ providedIn: 'root' })
export class SonidoService {
  private readonly cache = new Map<string, HTMLAudioElement>();

  /** Descarga el archivo antes de necesitarlo, para que suene sin demora al primer click. */
  precargar(url: string): void {
    this.obtener(url);
  }

  reproducir(url: string, volumen = 0.7): void {
    const audio = this.obtener(url);

    if (!audio) {
      return;
    }

    try {
      audio.volume = volumen;
      audio.currentTime = 0;
      void audio.play()?.catch(() => undefined);
    } catch {
      // Sin audio disponible: no pasa nada.
    }
  }

  private obtener(url: string): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') {
      return null;
    }

    let audio = this.cache.get(url);

    if (!audio) {
      audio = new Audio(url);
      audio.preload = 'auto';
      this.cache.set(url, audio);
    }

    return audio;
  }
}