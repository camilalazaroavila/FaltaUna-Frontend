import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { ExpoService } from '@servicios/expo.service';
import type { ConfiguracionExpo, SobreResumen } from '@modelos/expo.model';

@Component({
  selector: 'app-expo-admin',
  standalone: true,
  templateUrl: './expo-admin.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpoAdmin {
  private readonly expoService = inject(ExpoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);

  protected readonly sobres = signal<SobreResumen[]>([]);
  protected readonly configuracion = signal<ConfiguracionExpo | null>(null);

  protected readonly sobreActual = computed(() => {
    const id = this.configuracion()?.sobreRegaloId;
    return id == null ? null : (this.sobres().find((s) => s.id === id) ?? { id });
  });

  constructor() {
    this.cargarPanel();
    this.iniciarPolling();
  }

  protected elegirSobre(sobre: SobreResumen): void {
    this.guardarCambio(sobre.id, true, `Cargado: ${this.etiqueta(sobre)}`);
  }

  protected desactivar(): void {
    this.guardarCambio(null, false, 'Regalo desactivado');
  }

  protected etiqueta(sobre: SobreResumen): string {
    return sobre.nombre ?? `Sobre #${sobre.id}`;
  }

  private cargarPanel(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.expoService
      .obtenerConfiguracion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.configuracion.set(cfg);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudo conectar con el servidor.');
          this.cargando.set(false);
        },
      });

    this.cargarSobres();
  }

  private cargarSobres(): void {
    this.expoService
      .obtenerSobres()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sobres) => this.sobres.set(sobres),
        error: () => this.error.set('No se pudo cargar la lista de sobres.'),
      });
  }

  private guardarCambio(sobreId: number | null, activo: boolean, textoOk: string): void {
    this.error.set(null);
    this.mensaje.set(null);

    this.expoService
      .cambiarSobreRegalo(sobreId, activo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.configuracion.set(cfg);
          this.mensaje.set(textoOk);
        },
        error: () => this.error.set('No se pudo guardar el cambio.'),
      });
  }

  /** Refresca el estado cada 5 s para ver cuándo se consumió el regalo. */
  private iniciarPolling(): void {
    timer(5000, 5000)
      .pipe(
        switchMap(() =>
          this.expoService.obtenerConfiguracion().pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cfg) => this.configuracion.set(cfg));
  }
}
