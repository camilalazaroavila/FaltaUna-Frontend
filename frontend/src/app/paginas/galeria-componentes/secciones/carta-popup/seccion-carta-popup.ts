import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CartaComponent } from '@compartidos/componentes/carta/carta';
import { CartaPopupComponent } from '@compartidos/componentes/carta-popup/carta-popup';
import { PulsacionCartaDirective } from '@compartidos/directivas/pulsacion-carta.directive';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import type { Carta } from '@modelos/carta.model';

const CARTAS_MUESTRA: readonly Carta[] = [
  {
    id: 'muestra-comun',
    nombre: 'Danonino',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 12,
    atributoDerecho: 8,
    obtenida: true,
  },
  {
    id: 'muestra-legendaria',
    nombre: 'Edición legendaria',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'legendaria',
    categoria: 'tecnologia',
    atributoIzquierdo: 40,
    atributoDerecho: 3,
    obtenida: true,
  },
  {
    id: 'muestra-no-obtenida',
    nombre: 'Carta secreta',
    imagenUrl: 'imagenes/Sprite.png',
    rareza: 'rara',
    categoria: 'musica',
    atributoIzquierdo: 15,
    atributoDerecho: 20,
    obtenida: false,
  },
];

@Component({
  selector: 'app-seccion-carta-popup',
  standalone: true,
  imports: [CartaComponent, CartaPopupComponent, PulsacionCartaDirective, TarjetaMuestra],
  template: `
    <section id="carta-popup" aria-labelledby="titulo-carta-popup">
      <header class="mb-4">
        <h2 id="titulo-carta-popup" class="font-titulo text-lg text-texto-primario">
          app-carta-popup
        </h2>
        <p class="font-cuerpo text-sm text-texto-secundario">
          Detalle de una carta abierto desde el gesto de tarjeta.
        </p>
      </header>

      <app-tarjeta-muestra
        titulo="app-carta-popup"
        descripcion="Rareza, categoría y la oración genérica 'Cuesta X y suma Y'. Las cartas no obtenidas ocultan el nombre y la oración."
      >
        <div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:w-96">
          @for (carta of cartas; track carta.id) {
            <button
              type="button"
              class="block w-full cursor-pointer p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco"
              appPulsacionCarta
              [attr.aria-label]="'Abrir detalle de ' + carta.nombre"
              (pulsacion)="abrir(carta)"
            >
              <app-carta [carta]="carta" />
            </button>
          }
        </div>

        <p slot="nota" class="mt-4 font-interfaz text-xs text-texto-apagado">
          Clic con el mouse o mantener presionado en touch. En el catálogo de "Mi baraja" la carta
          solo responde a la pulsación, porque el clic ya selecciona.
        </p>
      </app-tarjeta-muestra>

      @if (abierta(); as carta) {
        <app-carta-popup [carta]="carta" (cerrar)="cerrar()" />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionCartaPopup {
  protected readonly cartas = CARTAS_MUESTRA;
  protected readonly abierta = signal<Carta | null>(null);

  protected abrir(carta: Carta): void {
    this.abierta.set(carta);
  }

  protected cerrar(): void {
    this.abierta.set(null);
  }
}
