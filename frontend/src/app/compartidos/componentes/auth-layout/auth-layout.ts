import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { Header } from '../header/header';
import { AuthModoToggle } from './auth-modo-toggle';
import { ModoAuth, injectModoAuth } from './auth-modo';

/** Una imagen distinta por pantalla: login y registro cambian de fondo. */
type VarianteAuth = 'login' | 'registro';

const IMAGENES: Record<ModoAuth, Record<VarianteAuth, string>> = {
  jugador: {
    login: '/imagenes/auth/usuario/jugar.jpg',
    registro: '/imagenes/auth/usuario/cartas.jpg',
  },
  empresa: {
    login: '/imagenes/auth/empresa/diego-ph.jpg',
    registro: '/imagenes/auth/empresa/miikka.jpg',
  },
};

const TEXTOS: Record<ModoAuth, { titulo: string; subtitulo: string }> = {
  jugador: {
    titulo: 'Traé tu colección a la realidad',
    subtitulo: 'Canjeá tus colecciones por productos reales.',
  },
  empresa: {
    titulo: 'Creá tu cuenta de empresa',
    subtitulo: 'Publicá tus colecciones y conseguí la publicidad que buscas.',
  },
};

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [Header, AuthModoToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  protected readonly modo = injectModoAuth();

  /** Pantalla que renderiza el layout: define el copy de overlay y la foto lateral. */
  readonly variante = input.required<VarianteAuth>();

  protected readonly imagen = computed(() => IMAGENES[this.modo()][this.variante()]);
  protected readonly texto = computed(() => TEXTOS[this.modo()]);

  // Guardamos QUÉ imagen terminó de cargar; así no hace falta resetear nada al cambiar de modo.
  private readonly srcCargada = signal<string | null>(null);
  protected readonly imagenCargada = computed(() => this.srcCargada() === this.imagen());

  protected marcarCargada(): void {
    this.srcCargada.set(this.imagen());
  }
  protected marcarError(): void {
    this.srcCargada.set(null);
  }

  constructor() {
    const raiz = document.documentElement;
    const modoPrevio = raiz.getAttribute('data-modo');

    effect(() => raiz.setAttribute('data-modo', this.modo()));

    // Aplicación síncrona inicial: el effect corre recién en el ciclo de detección,
    // y acá aseguramos el tema (o la reescritura del previo sin URL con ?modo) al pintar.
    raiz.setAttribute('data-modo', this.modo());

    inject(DestroyRef).onDestroy(() => {
      if (modoPrevio) raiz.setAttribute('data-modo', modoPrevio);
      else raiz.removeAttribute('data-modo');
    });
  }
}