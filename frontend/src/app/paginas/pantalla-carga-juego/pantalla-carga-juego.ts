import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ModoJuego, esModoJuego } from '@app/modelos/modo-juego.model';
import { EmparejamientoService } from '@app/servicios/emparejamiento.service';

interface TextosCarga {
  /** Los \n se respetan en pantalla (whitespace-pre-line), como las líneas del mockup. */
  readonly buscando: string;
  readonly listo: string;
}

// TODO: confirmar los textos de ia y tutorial; por ahora solo existe el mockup de PvP.
const TEXTOS_CARGA: Record<ModoJuego, TextosCarga> = {
  pvp: { buscando: 'Buscando\notros\njugadores...', listo: 'Jugador\nencontrado' },
  ia: { buscando: 'Preparando\nla partida...', listo: 'Partida\nlista' },
  tutorial: { buscando: 'Preparando\nel tutorial...', listo: 'Tutorial\nlisto' },
};

const MODO_POR_DEFECTO: ModoJuego = 'pvp';

@Component({
  selector: 'app-pantalla-carga-juego',
  templateUrl: './pantalla-carga-juego.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantallaCargaJuego {
  private readonly ruta = inject(ActivatedRoute);
  private readonly emparejamiento = inject(EmparejamientoService);

  private readonly modo = this.leerModoDeLaRuta();

  protected readonly textos = TEXTOS_CARGA[this.modo];

  // toSignal se desuscribe solo cuando la pantalla se destruye.
  protected readonly encontrado = toSignal(this.emparejamiento.buscarPartida(this.modo), {
    initialValue: false,
  });

  protected readonly mensaje = computed(() =>
    this.encontrado() ? this.textos.listo : this.textos.buscando,
  );

  private leerModoDeLaRuta(): ModoJuego {
    const modoRuta: unknown = this.ruta.snapshot.data['modo'];
    return esModoJuego(modoRuta) ? modoRuta : MODO_POR_DEFECTO;
  }
}