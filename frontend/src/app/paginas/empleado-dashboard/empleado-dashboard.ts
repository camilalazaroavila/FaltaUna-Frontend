import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CuponesService } from '../../servicios/cupones.service';
import { CanjeErrorRespuesta, CanjeExitosoRespuesta, CuponValidado } from '../../modelos/cupon.model';

import urlLogo from '../../compartidos/SVGs/Imagotipo_claro.svg';

const MENSAJE_CODIGO_INVALIDO = 'El código que ingresaste es incorrecto o está expirado';
const MENSAJE_SIN_CONEXION = 'No pudimos conectarnos con el servidor. Probá de nuevo en un momento.';

type ResultadoCanje =
  | { tipo: 'exito'; cupon: CanjeExitosoRespuesta }
  | { tipo: 'error'; mensaje: string };

/** API del navegador (Chrome/Android) para leer QR sin librerías; no está en los tipos de TS. */
interface DetectorBarcode {
  detect(fuente: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type ConstructorDetector = new (opciones: { formats: string[] }) => DetectorBarcode;

/**
 * Panel del empleado: ingresa el token o escanea el QR del cliente, VALIDA el cupón
 * (el servidor muestra a qué cupón y usuario corresponde) y recién después lo canjea.
 * La validación y el canje los decide siempre el servidor.
 */
@Component({
  selector: 'app-empleado-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './empleado-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrarModales()' },
})
export class EmpleadoDashboard {
  readonly authService = inject(AuthService);
  private readonly cuponesService = inject(CuponesService);
  private readonly router = inject(Router);

  protected readonly urlLogo = urlLogo;

  protected readonly codigo = signal('');
  protected readonly enviando = signal(false);
  protected readonly resultado = signal<ResultadoCanje | null>(null);
  /** Cupón verificado por el servidor, pendiente de confirmar el canje. */
  protected readonly validacion = signal<CuponValidado | null>(null);
  protected readonly menuAbierto = signal(false);

  protected readonly escaneando = signal(false);
  protected readonly errorEscaner = signal<string | null>(null);
  protected readonly escanerDisponible =
    typeof window !== 'undefined' &&
    'BarcodeDetector' in window &&
    !!navigator.mediaDevices?.getUserMedia;

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private flujo: MediaStream | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detenerEscaner());
  }

  /** Normaliza lo que se escribe o pega: sin espacios y en mayúsculas (el token puede ser largo). */
  protected alEscribir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const limpio = entrada.value.replace(/\s/g, '').toUpperCase();
    entrada.value = limpio;
    this.codigo.set(limpio);
  }

  /** Paso 1: verifica el token sin consumir el cupón. */
  protected validar(evento?: Event): void {
    evento?.preventDefault();
    const codigo = this.codigo().trim();
    if (!codigo || this.enviando()) return;

    this.enviando.set(true);
    this.cuponesService.validar(codigo).subscribe({
      next: (cupon) => {
        this.enviando.set(false);
        this.validacion.set(cupon);
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        this.resultado.set({ tipo: 'error', mensaje: this.mensajeDeError(respuesta) });
      },
    });
  }

  /** Paso 2: el empleado confirma y el cupón se consume. */
  protected confirmarCanje(): void {
    this.validacion.set(null);
    this.canjear();
  }

  protected cancelarValidacion(): void {
    this.validacion.set(null);
  }

  protected cerrarModales(): void {
    this.validacion.set(null);
    this.resultado.set(null);
  }

  protected canjear(evento?: Event): void {
    evento?.preventDefault();
    const codigo = this.codigo().trim();
    if (!codigo || this.enviando()) return;

    this.enviando.set(true);
    this.cuponesService.canjear(codigo).subscribe({
      next: (cupon) => {
        this.enviando.set(false);
        this.codigo.set('');
        this.resultado.set({ tipo: 'exito', cupon });
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        this.resultado.set({ tipo: 'error', mensaje: this.mensajeDeError(respuesta) });
      },
    });
  }

  protected cerrarResultado(): void {
    this.resultado.set(null);
  }

  protected async iniciarEscaner(): Promise<void> {
    if (!this.escanerDisponible || this.escaneando()) return;
    this.errorEscaner.set(null);

    try {
      this.flujo = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
    } catch {
      this.errorEscaner.set('No pudimos acceder a la cámara. Revisá los permisos del navegador.');
      return;
    }

    this.escaneando.set(true);
    // El <video> se crea al activar `escaneando`; se espera un ciclo de render.
    await new Promise((resolver) => setTimeout(resolver));

    const elemento = this.video()?.nativeElement;
    if (!elemento || !this.flujo) {
      this.detenerEscaner();
      return;
    }
    elemento.srcObject = this.flujo;
    await elemento.play();

    const Detector = (window as unknown as { BarcodeDetector: ConstructorDetector })
      .BarcodeDetector;
    const detector = new Detector({ formats: ['qr_code'] });
    void this.leerCuadros(elemento, detector);
  }

  protected detenerEscaner(): void {
    this.flujo?.getTracks().forEach((pista) => pista.stop());
    this.flujo = null;
    this.escaneando.set(false);
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private async leerCuadros(elemento: HTMLVideoElement, detector: DetectorBarcode): Promise<void> {
    while (this.escaneando() && this.flujo) {
      try {
        const lecturas = await detector.detect(elemento);
        if (lecturas.length > 0) {
          this.detenerEscaner();
          this.codigo.set(lecturas[0].rawValue.toUpperCase());
          this.validar();
          return;
        }
      } catch {
        // Un cuadro que no se pudo analizar no corta el escaneo.
      }
      await new Promise((resolver) => setTimeout(resolver, 250));
    }
  }

  private mensajeDeError(respuesta: HttpErrorResponse): string {
    if (respuesta.status === 0 || respuesta.status >= 500) return MENSAJE_SIN_CONEXION;
    const cuerpo = respuesta.error as Partial<CanjeErrorRespuesta> | null;
    return cuerpo?.mensaje ?? MENSAJE_CODIGO_INVALIDO;
  }
}