import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { GsapService } from '../../../servicios/gsap.service';

/**
 * CTA hero: la accion de mayor peso visual de la aplicacion.
 *
 * A diferencia de `app-boton`, que se mantiene liviano para uso masivo, este
 * control encapsula su microinteraccion: respiracion del halo verde al pasar
 * el cursor y rebote elastico al presionar. Ambas se desactivan por completo
 * cuando el usuario pidio reducir el movimiento.
 *
 * El host solo aporta su participacion en el layout; toda la capa visual vive
 * en el `<button>` interno para conservar la semantica nativa de `disabled`.
 */
@Component({
  selector: 'app-boton-jugar',
  imports: [NgIcon],
  templateUrl: './boton-jugar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
})
export class BotonJugar implements AfterViewInit {
  private readonly gsapServicio = inject(GsapService);
  private readonly elementoRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly referenciaBoton = viewChild.required<ElementRef<HTMLButtonElement>>('boton');
  private readonly referenciaHalo = viewChild<ElementRef<HTMLElement>>('halo');

  /** Opacidad de reposo del halo cuando el usuario no interactua con el control. */
  private readonly opacidadReposo = 0.4;

  readonly texto = input('JUGAR');
  readonly subtexto = input<string>();
  readonly deshabilitado = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly accion = output<void>();

  protected readonly haySubtexto = computed(() => !!this.subtexto()?.trim());
  protected readonly movimientoPermitido = this.gsapServicio.movimientoReducido;

  ngAfterViewInit(): void {
    const ambito = this.elementoRef.nativeElement;
    const boton = this.referenciaBoton().nativeElement;
    const halo = this.referenciaHalo()?.nativeElement;

    // Sin halo no hay nada que animar: el control sigue siendo utilizable.
    if (!halo) {
      return;
    }

    const { gsap } = this.gsapServicio;
    let haloRespirando = false;

    // El ambito del contexto es el host, de modo que la reversion tambien
    // retira los listeners de puntero registrados dentro del callback.
    this.gsapServicio.crearContexto(ambito, () => {
      const animado = () => this.movimientoPermitido() && !this.deshabilitado();

      const respirar = () => {
        if (!animado() || haloRespirando) {
          return;
        }

        haloRespirando = true;
        gsap.fromTo(
          halo,
          { opacity: this.opacidadReposo },
          {
            opacity: 1,
            duration: 0.9,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            overwrite: true,
            onInterrupt: () => (haloRespirando = false),
          }
        );
      };

      gsap.set(halo, { opacity: this.opacidadReposo });

      boton.addEventListener('pointerenter', () => {
        if (!animado()) {
          return;
        }

        respirar();
        gsap.to(boton, { y: -3, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
      });

      boton.addEventListener('pointerleave', () => {
        gsap.killTweensOf(halo);
        gsap.to(halo, { opacity: this.opacidadReposo, duration: 0.3, overwrite: true });
        gsap.to(boton, { y: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      });

      boton.addEventListener('pointerdown', () => {
        if (!animado()) {
          return;
        }

        gsap.fromTo(
          boton,
          { scale: 1 },
          {
            scale: 0.94,
            duration: 0.09,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out',
            overwrite: true,
          }
        );
      });
    });
  }
}
