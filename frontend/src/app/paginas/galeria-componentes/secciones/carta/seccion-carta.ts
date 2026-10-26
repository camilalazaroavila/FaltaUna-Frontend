import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { IndicadorCategoriasHabilidad } from '@compartidos/componentes/cartas/indicador-categorias-habilidad/indicador-categorias-habilidad';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import type { Carta, EfectoCategoriaCarta } from '@modelos/carta.model';

@Component({
  selector: 'app-seccion-carta',
  standalone: true,
  imports: [CartaComponent, IndicadorCategoriasHabilidad, TarjetaMuestra],
  template: `
    <section id="carta" aria-labelledby="titulo-carta" class="space-y-6">
      <header class="mb-4">
        <h2 id="titulo-carta" class="font-titulo text-lg text-texto-primario">app-carta</h2>
        <p class="font-cuerpo text-sm text-texto-secundario">Carta coleccionable y sus indicadores visuales.</p>
      </header>
      <app-tarjeta-muestra titulo="Muestras de cartas">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          @for (carta of cartas(); track carta.id) {
            <app-carta [carta]="carta"></app-carta>
          }
        </div>
      </app-tarjeta-muestra>

      <app-tarjeta-muestra
        titulo="app-indicador-categorias-habilidad"
        descripcion="Indicador visual que muestra qué categorías mejora (+) y empeora (−) una habilidad o zona. Incluye íconos, signo explícito, variantes de tamaño y resumen +N si supera el límite visible."
      >
        <div class="flex flex-wrap items-start gap-8">
          <div class="space-y-2">
            <span class="block font-interfaz text-xs font-bold text-texto-secundario uppercase">Mejora (sube)</span>
            <app-indicador-categorias-habilidad [efectos]="muestraSube" tamanio="md" />
          </div>

          <div class="space-y-2">
            <span class="block font-interfaz text-xs font-bold text-texto-secundario uppercase">Reduce (baja)</span>
            <app-indicador-categorias-habilidad [efectos]="muestraBaja" tamanio="md" />
          </div>

          <div class="space-y-2">
            <span class="block font-interfaz text-xs font-bold text-texto-secundario uppercase">Mixto (sube y baja)</span>
            <app-indicador-categorias-habilidad [efectos]="muestraMixto" tamanio="md" />
          </div>

          <div class="space-y-2">
            <span class="block font-interfaz text-xs font-bold text-texto-secundario uppercase">Resumen +N (3 categorías, máx 2)</span>
            <app-indicador-categorias-habilidad [efectos]="muestraOverflow" [maxVisibles]="2" tamanio="md" />
          </div>

          <div class="space-y-2">
            <span class="block font-interfaz text-xs font-bold text-texto-secundario uppercase">Horizontal (tamaño sm)</span>
            <app-indicador-categorias-habilidad [efectos]="muestraMixto" orientacion="horizontal" tamanio="sm" />
          </div>
        </div>
      </app-tarjeta-muestra>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionCarta {
  protected readonly muestraSube: readonly EfectoCategoriaCarta[] = [
    { tipo: 'sube', categoria: 'musica', valor: 2 },
  ];

  protected readonly muestraBaja: readonly EfectoCategoriaCarta[] = [
    { tipo: 'baja', categoria: 'tecnologia', valor: -1 },
  ];

  protected readonly muestraMixto: readonly EfectoCategoriaCarta[] = [
    { tipo: 'sube', categoria: 'gastronomia', valor: 3 },
    { tipo: 'baja', categoria: 'indumentaria', valor: -2 },
  ];

  protected readonly muestraOverflow: readonly EfectoCategoriaCarta[] = [
    { tipo: 'sube', categoria: 'gastronomia', valor: 2 },
    { tipo: 'sube', categoria: 'musica', valor: 1 },
    { tipo: 'baja', categoria: 'tecnologia', valor: -2 },
  ];

  protected readonly cartas = signal<Carta[]>([
    {
      id: '1',
      nombre: 'Jugador',
      rareza: 'comun',
      categoria: 'gastronomia',
      atributoIzquierdo: 7,
      atributoDerecho: 8,
      imagenUrl: 'https://placehold.co/400x400/1e3a3f/f4faf6?text=COMUN',
      obtenida: true,
      efectosCategoria: [{ tipo: 'sube', categoria: 'musica', valor: 2 }],
    },
    {
      id: '2',
      nombre: 'Rara',
      rareza: 'rara',
      categoria: 'cosmeticos',
      atributoIzquierdo: 9,
      atributoDerecho: 8,
      imagenUrl: 'https://placehold.co/400x400/1e3a3f/f4faf6?text=RARA',
      obtenida: true,
      efectosCategoria: [
        { tipo: 'sube', categoria: 'gastronomia', valor: 3 },
        { tipo: 'baja', categoria: 'indumentaria', valor: -2 },
      ],
    },
    {
      id: '3',
      nombre: 'Epica',
      rareza: 'epicarta',
      categoria: 'decoracion',
      atributoIzquierdo: 10,
      atributoDerecho: 9,
      imagenUrl: 'https://placehold.co/400x400/1e3a3f/f4faf6?text=EPIC',
      obtenida: true,
      efectosCategoria: [
        { tipo: 'sube', categoria: 'decoracion', valor: 2 },
        { tipo: 'sube', categoria: 'cosmeticos', valor: 1 },
        { tipo: 'baja', categoria: 'tecnologia', valor: -1 },
      ],
    },
    {
      id: '4',
      nombre: '???',
      rareza: 'legendaria',
      categoria: 'tecnologia',
      atributoIzquierdo: 99,
      atributoDerecho: 99,
      imagenUrl: 'https://placehold.co/400x400/1e3a3f/f4faf6?text=?',
      obtenida: false,
    },
  ]);
}