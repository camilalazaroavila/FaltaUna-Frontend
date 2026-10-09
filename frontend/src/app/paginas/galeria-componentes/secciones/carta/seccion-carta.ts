import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CartaComponent } from '../../../../compartidos/componentes/carta/carta';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import type { Carta } from '../../../../modelos/carta.model';

@Component({
  selector: 'app-seccion-carta',
  standalone: true,
  imports: [CartaComponent, TarjetaMuestra],
  template: `
    <section id="carta" aria-labelledby="titulo-carta">
      <header class="mb-4">
        <h2 id="titulo-carta" class="font-titulo text-lg text-texto-primario">app-carta</h2>
        <p class="font-cuerpo text-sm text-texto-secundario">Carta coleccionable.</p>
      </header>
      <app-tarjeta-muestra titulo="Muestras de cartas">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          @for (carta of cartas(); track carta.id) {
            <app-carta [carta]="carta"></app-carta>
          }
        </div>
      </app-tarjeta-muestra>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionCarta {
  protected readonly cartas = signal<Carta[]>([
    {id:'1',nombre:'Jugador',rareza:'comun',categoria:'gastronomia',atributoIzquierdo:7,atributoDerecho:8,imagenUrl:'https://placehold.co/400x400/1e3a3f/f4faf6?text=COMUN',obtenida:true},
    {id:'2',nombre:'Rara',rareza:'rara',categoria:'cosmeticos',atributoIzquierdo:9,atributoDerecho:8,imagenUrl:'https://placehold.co/400x400/1e3a3f/f4faf6?text=RARA',obtenida:true},
    {id:'3',nombre:'Epica',rareza:'epicarta',categoria:'decoracion',atributoIzquierdo:10,atributoDerecho:9,imagenUrl:'https://placehold.co/400x400/1e3a3f/f4faf6?text=EPIC',obtenida:true},
    {id:'4',nombre:'???',rareza:'legendaria',categoria:'tecnologia',atributoIzquierdo:99,atributoDerecho:99,imagenUrl:'https://placehold.co/400x400/1e3a3f/f4faf6?text=?',obtenida:false},
  ]);
}