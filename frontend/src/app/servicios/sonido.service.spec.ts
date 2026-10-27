import { TestBed } from '@angular/core/testing';
import { SONIDOS_PARTIDA, SonidoService } from './sonido.service';

describe('SonidoService', () => {
  let service: SonidoService;

  beforeAll(() => {
    if (typeof window !== 'undefined' && window.HTMLMediaElement) {
      window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
      window.HTMLMediaElement.prototype.pause = jest.fn();
    }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SonidoService],
    });
    service = TestBed.inject(SonidoService);
  });

  it('se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('no falla al precargar o reproducir cuando Audio no está disponible (SSR / Node)', () => {
    expect(() => {
      service.precargar('/sonidos/test.mp3');
      service.reproducir('/sonidos/test.mp3');
      service.precargarSonidosPartida();
    }).not.toThrow();
  });

  describe('con Audio simulado', () => {
    let playMock: jest.Mock;
    let audioInstancias: Array<{
      src: string;
      preload: string;
      volume: number;
      currentTime: number;
      paused: boolean;
      play: jest.Mock;
      cloneNode: jest.Mock;
    }>;
    let audioOriginal: typeof Audio | undefined;

    beforeEach(() => {
      audioInstancias = [];
      playMock = jest.fn().mockResolvedValue(undefined);
      audioOriginal = globalThis.Audio;

      // Mock de HTMLAudioElement
       
      (globalThis as any).Audio = class MockAudio {
        src: string;
        preload = '';
        volume = 1;
        currentTime = 0;
        paused = true;
        play = playMock;
        cloneNode = jest.fn().mockImplementation(() => {
          const clon = {
            src: this.src,
            preload: this.preload,
            volume: this.volume,
            currentTime: 0,
            paused: false,
            play: jest.fn().mockResolvedValue(undefined),
          };
          return clon;
        });

        constructor(src: string) {
          this.src = src;
          audioInstancias.push(this);
        }
      };
    });

    afterEach(() => {
       
      (globalThis as any).Audio = audioOriginal;
    });

    it('precarga un archivo de audio y lo almacena en caché', () => {
      service.precargar(SONIDOS_PARTIDA.apoyarCarta);

      expect(audioInstancias.length).toBe(1);
      expect(audioInstancias[0].preload).toBe('auto');
      expect(audioInstancias[0].src).toBe(encodeURI(SONIDOS_PARTIDA.apoyarCarta));

      // Precargar de nuevo la misma URL no crea otra instancia
      service.precargar(SONIDOS_PARTIDA.apoyarCarta);
      expect(audioInstancias.length).toBe(1);
    });

    it('reproduce con el volumen configurado y arranca desde el principio', () => {
      service.reproducir(SONIDOS_PARTIDA.apoyarCarta, 0.5);

      expect(audioInstancias.length).toBe(1);
      expect(audioInstancias[0].volume).toBe(0.5);
      expect(audioInstancias[0].currentTime).toBe(0);
      expect(playMock).toHaveBeenCalled();
    });

    it('clona el elemento cuando ya está sonando para permitir superposición polifónica', () => {
      service.reproducir(SONIDOS_PARTIDA.cartaSumaPoder, 0.8);
      expect(audioInstancias.length).toBe(1);

      // Simulamos que el audio base sigue sonando (paused = false)
      audioInstancias[0].paused = false;

      service.reproducir(SONIDOS_PARTIDA.cartaSumaPoder, 0.8);
      expect(audioInstancias[0].cloneNode).toHaveBeenCalled();
    });

    it('precarga en bloque todos los efectos de la partida', () => {
      service.precargarSonidosPartida();

      const cantidadEfectos = Object.keys(SONIDOS_PARTIDA).length;
      expect(audioInstancias.length).toBe(cantidadEfectos);
    });
  });
});
