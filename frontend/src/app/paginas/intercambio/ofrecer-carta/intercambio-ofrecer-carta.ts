import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Header } from '@compartidos/componentes/layout/header/header';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { CartaPopupComponent } from '@compartidos/componentes/cartas/carta-popup/carta-popup';
import { IntercambioService } from '@servicios/intercambio.service';
import type { Carta } from '@modelos/carta.model';
import type { Coleccionista } from '@modelos/intercambio.model';

@Component({
  selector: 'app-intercambio-ofrecer-carta',
  standalone: true,
  imports: [Header, RouterLink, CartaComponent, CartaPopupComponent],
  templateUrl: './intercambio-ofrecer-carta.html',
  styleUrl: './intercambio-ofrecer-carta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntercambioOfrecerCarta implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly intercambioService = inject(IntercambioService);

  protected readonly cargando = signal(true);
  protected readonly enviandoOferta = signal(false);
  protected readonly errorMensaje = signal<string | null>(null);
  protected readonly coleccionista = signal<Coleccionista | null>(null);
  protected readonly cartasRepetidas = signal<readonly Carta[]>([]);
  protected readonly cartaSeleccionada = signal<Carta | null>(null);
  protected readonly ofertaConfirmada = signal(false);

  // Modo responder a una oferta recibida
  protected readonly modoResponder = signal(false);
  protected readonly intercambioId = signal<number | null>(null);
  protected readonly rutaVolver = computed(() =>
    this.modoResponder()
      ? '/usuario/intercambio/activos'
      : '/usuario/intercambio/coleccionistas',
  );

  // Cartas favoritas del coleccionista (estilo Pokémon Pocket)
  protected readonly cargandoFavoritas = signal(true);
  protected readonly cartasFavoritas = signal<readonly Carta[]>([]);
  protected readonly cartasFavoritasVisibles = computed(() =>
    this.cartasFavoritas().slice(0, 5),
  );
  protected readonly modalFavoritasAbierto = signal(false);
  protected readonly cartaDetallePopup = signal<Carta | null>(null);

  // Cartas repetidas ordenadas: primero aquellas que coinciden con las deseadas del otro usuario
  protected readonly cartasRepetidasOrdenadas = computed(() => {
    const repetidas = this.cartasRepetidas();
    const favoritas = this.cartasFavoritas();
    if (!favoritas.length || !repetidas.length) {
      return repetidas;
    }
    const idsFavoritas = new Set(favoritas.map((f) => f.id));
    return [...repetidas].sort((a, b) => {
      const aEsFav = idsFavoritas.has(a.id);
      const bEsFav = idsFavoritas.has(b.id);
      if (aEsFav && !bEsFav) return -1;
      if (!aEsFav && bEsFav) return 1;
      return 0;
    });
  });

  esFavoritaDelOtro(cartaId: string): boolean {
    return this.cartasFavoritas().some((f) => f.id === cartaId);
  }

  ngOnInit(): void {
    const intercambioIdParam = this.route.snapshot.paramMap.get('intercambioId');
    const coleccionistaIdParam = this.route.snapshot.paramMap.get('coleccionistaId');

    if (intercambioIdParam) {
      // Modo Responder a solicitud recibida
      const intercambioId = Number(intercambioIdParam);
      this.modoResponder.set(true);
      this.intercambioId.set(intercambioId);

      this.intercambioService.obtenerIntercambioPorId(intercambioId).subscribe({
        next: (intercambio) => {
          if (intercambio) {
            const ofertanteId = intercambio.usuarioOfertanteId ?? intercambio.ofertanteId ?? 0;
            const ofertanteNombre = intercambio.usuarioOfertanteNombre || intercambio.ofertante || '';
            this.coleccionista.set({
              id: ofertanteId,
              nombreUsuario: ofertanteNombre,
            });
            this.cargarCartasFavoritas(ofertanteId);
          } else {
            this.cargandoFavoritas.set(false);
          }
        },
        error: () => this.cargandoFavoritas.set(false),
      });
    } else if (coleccionistaIdParam) {
      // Modo Crear nueva oferta
      const coleccionistaId = Number(coleccionistaIdParam);
      const actual = this.intercambioService.coleccionistaSeleccionado();
      if (actual && actual.id === coleccionistaId) {
        this.coleccionista.set(actual);
      } else {
        this.intercambioService.obtenerColeccionistaPorId(coleccionistaId).subscribe({
          next: (col) => this.coleccionista.set(col),
        });
      }
      this.cargarCartasFavoritas(coleccionistaId);
    } else {
      this.cargandoFavoritas.set(false);
    }

    this.cargarCartasRepetidas();
  }

  cargarCartasFavoritas(coleccionistaId: number): void {
    this.cargandoFavoritas.set(true);
    this.intercambioService.obtenerCartasFavoritasDeColeccionista(coleccionistaId).subscribe({
      next: (favoritas) => {
        this.cartasFavoritas.set(favoritas);
        this.cargandoFavoritas.set(false);
      },
      error: () => {
        this.cartasFavoritas.set([]);
        this.cargandoFavoritas.set(false);
      },
    });
  }

  tengoRepetida(cartaId: string): boolean {
    return this.cartasRepetidas().some((c) => c.id === cartaId);
  }

  abrirModalFavoritas(): void {
    this.modalFavoritasAbierto.set(true);
  }

  cerrarModalFavoritas(): void {
    this.modalFavoritasAbierto.set(false);
  }

  abrirDetalleCarta(carta: Carta): void {
    this.cartaDetallePopup.set(carta);
  }

  cerrarDetalleCarta(): void {
    this.cartaDetallePopup.set(null);
  }

  ofrecerDesdeFavorita(cartaFavorita: Carta): void {
    const repetida = this.cartasRepetidas().find((c) => c.id === cartaFavorita.id);
    if (repetida) {
      this.seleccionarCarta(repetida);
      this.cerrarModalFavoritas();
    }
  }

  cargarCartasRepetidas(): void {
    this.cargando.set(true);
    this.intercambioService.obtenerCartasRepetidas().subscribe({
      next: (cartas) => {
        this.cartasRepetidas.set(cartas);
        this.cargando.set(false);
      },
      error: () => {
        this.cartasRepetidas.set([]);
        this.cargando.set(false);
      },
    });
  }

  seleccionarCarta(carta: Carta): void {
    this.cartaSeleccionada.set(carta);
    this.ofertaConfirmada.set(false);
  }

  cancelarSeleccion(): void {
    this.cartaSeleccionada.set(null);
    this.ofertaConfirmada.set(false);
    this.intercambioService.limpiarSeleccion();
  }

  confirmarSeleccion(): void {
    const carta = this.cartaSeleccionada();
    if (!carta || this.enviandoOferta()) return;

    this.errorMensaje.set(null);
    this.intercambioService.seleccionarCarta(carta);
    this.enviandoOferta.set(true);

    if (this.modoResponder() && this.intercambioId()) {
      // Responder oferta existente
      const id = this.intercambioId()!;
      this.intercambioService.responderIntercambio(id, Number(carta.id)).subscribe({
        next: () => {
          this.enviandoOferta.set(false);
          this.router.navigate(['/usuario/intercambio/pendiente', id]);
        },
        error: (err) => {
          this.enviandoOferta.set(false);
          const msg =
            err?.error?.mensaje ||
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            'Error al responder la solicitud de intercambio.';
          this.errorMensaje.set(msg);
        },
      });
    } else {
      // Crear nueva oferta
      const col = this.coleccionista();
      if (!col) return;

      this.intercambioService
        .crearIntercambio({ usuarioReceptorId: col.id, cartaId: Number(carta.id) })
        .subscribe({
          next: (res) => {
            this.enviandoOferta.set(false);
            this.router.navigate(['/usuario/intercambio/pendiente', res.id]);
          },
          error: (err) => {
            this.enviandoOferta.set(false);
            const msg =
              err?.error?.mensaje ||
              err?.error?.message ||
              (typeof err?.error === 'string' ? err.error : null) ||
              'No se pudo enviar la solicitud de intercambio. Podrías haber alcanzado el límite diario de 3 intentos o la carta ya no estar disponible.';
            this.errorMensaje.set(msg);
          },
        });
    }
  }
}
