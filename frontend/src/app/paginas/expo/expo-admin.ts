import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { ExpoService } from '@servicios/expo.service';
import type { ConfiguracionExpo, SobreResumen } from '@modelos/expo.model';

const CLAVE_STORAGE = 'expo-clave';

@Component({
  selector: 'app-expo-admin',
  standalone: true,
  templateUrl: './expo-admin.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpoAdmin {
  private readonly expoService = inject(ExpoService);
  private readonly destroyRef = inject(DestroyRef);

  private clave = '';
  private pollingIniciado = false;

  protected readonly autenticado = signal(false);
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
    const guardada = this.leerClaveGuardada();
    if (guardada) this.validarYEntrar(guardada);
  }

  protected ingresar(evento: Event, valor: string): void {
    evento.preventDefault();
    const clave = valor.trim();
    if (clave) this.validarYEntrar(clave);
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

  protected salir(): void {
    this.clave = '';
    this.escribirClave(null);
    this.autenticado.set(false);
    this.configuracion.set(null);
  }

  private validarYEntrar(clave: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.expoService
      .obtenerConfiguracion(clave)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.clave = clave;
          this.escribirClave(clave);
          this.configuracion.set(cfg);
          this.autenticado.set(true);
          this.cargando.set(false);
          this.cargarSobres();
          this.iniciarPolling();
        },
        error: (err: HttpErrorResponse) => {
          this.escribirClave(null);
          this.error.set(
            err.status === 401 ? 'Clave incorrecta.' : 'No se pudo conectar con el servidor.',
          );
          this.cargando.set(false);
        },
      });
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
      .cambiarSobreRegalo(this.clave, sobreId, activo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.configuracion.set(cfg);
          this.mensaje.set(textoOk);
        },
        error: (err: HttpErrorResponse) =>
          this.error.set(
            err.status === 401 ? 'La clave dejó de ser válida.' : 'No se pudo guardar el cambio.',
          ),
      });
  }

  /** Refresca el estado cada 5 s para ver cuándo se consumió el regalo. */
  private iniciarPolling(): void {
    if (this.pollingIniciado) return;
    this.pollingIniciado = true;

    timer(5000, 5000)
      .pipe(
        switchMap(() =>
          this.expoService.obtenerConfiguracion(this.clave).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cfg) => this.configuracion.set(cfg));
  }

  private leerClaveGuardada(): string | null {
    try {
      return sessionStorage.getItem(CLAVE_STORAGE);
    } catch {
      return null;
    }
  }

  private escribirClave(valor: string | null): void {
    try {
      if (valor) sessionStorage.setItem(CLAVE_STORAGE, valor);
      else sessionStorage.removeItem(CLAVE_STORAGE);
    } catch {
      /* sessionStorage no disponible: se pedirá la clave de nuevo */
    }
  }
}