import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { ModoJuego, esModoJuego } from "@app/modelos/modo-juego.model";
import { EmparejamientoService } from "@app/servicios/emparejamiento.service";
import { GsapService } from "@app/servicios/gsap.service"; // ajustá la ruta si difiere

const MODO_POR_DEFECTO: ModoJuego = "pvp";

@Component({
  selector: "app-pantalla-carga-juego",
  templateUrl: "./pantalla-carga-juego.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantallaCargaJuego {
  private readonly ruta = inject(ActivatedRoute);
  private readonly emparejamiento = inject(EmparejamientoService);
  private readonly gsapService = inject(GsapService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly modo = this.leerModoDeLaRuta();

  // toSignal se desuscribe solo cuando la pantalla se destruye.
  protected readonly encontrado = toSignal(
    this.emparejamiento.buscarPartida(this.modo),
    {
      initialValue: false,
    },
  );

  // TODO: reemplazar por los nombres reales de la partida
  // (por ejemplo, servicio.jugadores().propio.nombre y .rival.nombre).
  readonly nombrePropio = input("Jaime");
  readonly nombreRival = input(this.modo === "pvp" ? "Falti" : "Bot");

  protected readonly anuncio = computed(() =>
    this.encontrado()
      ? `${this.nombrePropio()} contra ${this.nombreRival()}. ¡A luchar!`
      : "Cargando...",
  );

  constructor() {
    // Los elementos del encuentro recién existen después de que `encontrado` pasa a true,
    // por eso la animación se arma después del próximo render.
    effect(() => {
      if (this.encontrado()) {
        afterNextRender(() => this.animarEncuentro(), {
          injector: this.injector,
        });
      }
    });
  }

  private animarEncuentro(): void {
    if (this.gsapService.movimientoReducido()) {
      return;
    }

    const { gsap } = this.gsapService;

    this.gsapService.crearContexto(
      this.host.nativeElement,
      () => {
        // Cada valor se calcula con la posición real del elemento para que arranque fuera de la pantalla.
        const desdeIzquierda = (_i: number, el: Element) =>
          -(el.getBoundingClientRect().right + 24);
        const desdeDerecha = (_i: number, el: Element) =>
          window.innerWidth - el.getBoundingClientRect().left + 24;
        const desdeArriba = (_i: number, el: Element) =>
          -(el.getBoundingClientRect().bottom + 24);
        const desdeAbajo = (_i: number, el: Element) =>
          window.innerHeight - el.getBoundingClientRect().top + 24;

        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .from('[data-anim="nombre-propio"]', {
            x: desdeIzquierda,
            duration: 0.7,
          })
          .from(
            '[data-anim="nombre-rival"]',
            { x: desdeDerecha, duration: 0.7 },
            "<",
          )
          .from(
            '[data-anim="versus"]',
            { y: desdeArriba, duration: 0.6, ease: "back.out(1.6)" },
            0.25,
          )
          .from(
            '[data-anim="luchar"]',
            { y: desdeAbajo, duration: 0.7, ease: "back.out(1.2)" },
            0.6,
          );
      },
      this.destroyRef,
    );
  }

  private leerModoDeLaRuta(): ModoJuego {
    const modoRuta: unknown = this.ruta.snapshot.data["modo"];
    return esModoJuego(modoRuta) ? modoRuta : MODO_POR_DEFECTO;
  }
}
