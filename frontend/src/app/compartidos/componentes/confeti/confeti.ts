import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { GsapService } from '../../../servicios/gsap.service';

/** Colores de los papelitos: verdes de marca, amarillo de las estrellas de "Conseguiste", teal y un toque cálido. */
const COLORES = ['#2ee07a', '#1fa463', '#f9f9b2', '#f2c230', '#0d3b40', '#ff7a59'] as const;

interface OpcionesConfeti {
  /** Cantidad de papelitos. */
  cantidad?: number;
  /** Qué tan lejos salen disparados, en píxeles. */
  alcance?: number;
}

/**
 * Lluvia de papelitos de felicitación, la misma que se usa al celebrar.
 *
 * Se coloca una sola vez en la página y se dispara con `lanzar(x, y)` desde el punto
 * (coordenadas de la ventana) donde ocurrió el click. Respeta `prefers-reduced-motion`.
 *
 * ```html
 * <app-confeti #confeti />
 * <button (click)="confeti.lanzar($event.clientX, $event.clientY)">…</button>
 * ```
 */
@Component({
  selector: 'app-confeti',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pointer-events-none fixed inset-0 z-[60] overflow-hidden',
    'aria-hidden': 'true',
  },
  template: '',
})
export class Confeti {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly gsap = inject(GsapService);

  /** Dispara una explosión de papelitos desde (x, y). */
  lanzar(x: number, y: number, opciones: OpcionesConfeti = {}): void {
    if (this.gsap.movimientoReducido() || typeof this.host.animate !== 'function') {
      return;
    }

    const cantidad = opciones.cantidad ?? 70;
    const alcance = opciones.alcance ?? 320;

    for (let i = 0; i < cantidad; i++) {
      this.crearPapelito(x, y, alcance);
    }
  }

  /** Atajo para un click: usa el punto del puntero, o el centro del elemento si fue con teclado. */
  lanzarDesdeEvento(evento: MouseEvent | undefined, opciones?: OpcionesConfeti): void {
    let x = evento?.clientX ?? 0;
    let y = evento?.clientY ?? 0;

    if (evento && x === 0 && y === 0 && evento.currentTarget instanceof HTMLElement) {
      const caja = evento.currentTarget.getBoundingClientRect();
      x = caja.left + caja.width / 2;
      y = caja.top + caja.height / 2;
    }

    this.lanzar(x, y, opciones);
  }

  private crearPapelito(x: number, y: number, alcance: number): void {
    const papel = document.createElement('span');
    const esEstrella = Math.random() < 0.15;
    const color = COLORES[Math.floor(Math.random() * COLORES.length)];
    const ancho = 6 + Math.random() * 8;
    const alto = esEstrella ? ancho : 4 + Math.random() * 8;

    papel.style.cssText = `position:absolute;left:${x}px;top:${y}px;`;

    if (esEstrella) {
      papel.textContent = '★';
      papel.style.color = color;
      papel.style.fontSize = `${ancho + 6}px`;
      papel.style.lineHeight = '1';
    } else {
      papel.style.width = `${ancho}px`;
      papel.style.height = `${alto}px`;
      papel.style.backgroundColor = color;
      papel.style.borderRadius = Math.random() < 0.3 ? '50%' : '1px';
    }

    this.host.appendChild(papel);

    // Sale disparado hacia arriba y a los costados, y cae por gravedad dando vueltas.
    const angulo = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const fuerza = alcance * (0.35 + Math.random() * 0.65);
    const dx = Math.cos(angulo) * fuerza;
    const subida = Math.sin(angulo) * fuerza;
    const caida = 260 + Math.random() * 220;
    const giro = (Math.random() - 0.5) * 900;
    const duracion = 1400 + Math.random() * 1100;
    const deriva = (Math.random() - 0.5) * 80;

    const animacion = papel.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1, offset: 0 },
        {
          transform: `translate(${dx * 0.7}px, ${subida}px) rotate(${giro * 0.4}deg)`,
          opacity: 1,
          offset: 0.35,
        },
        {
          transform: `translate(${dx + deriva}px, ${subida + caida}px) rotate(${giro}deg)`,
          opacity: 0,
          offset: 1,
        },
      ],
      { duration: duracion, easing: 'cubic-bezier(0.25, 0.6, 0.5, 1)', fill: 'forwards' },
    );

    animacion.onfinish = () => papel.remove();
  }
}