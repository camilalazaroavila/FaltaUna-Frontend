import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@servicios/auth.service';
import { CuponesService } from '@servicios/cupones.service';
import { CanjeErrorRespuesta, CanjeExitosoRespuesta, CuponValidado } from '@modelos/cupon.model';
import { ModalResultado } from '@compartidos/componentes/modal-resultado/modal-resultado';
import { GeneradorCodigoSobre } from '@compartidos/componentes/empleado/generador-codigo-sobre/generador-codigo-sobre';
import { LectorQr } from '@compartidos/componentes/usuario/lector-qr/lector-qr';

import urlLogoBlanco from '@svgs/ImagotipoBlanco.svg';

const MENSAJE_CODIGO_INVALIDO = 'El código que ingresaste es incorrecto o está expirado';
const MENSAJE_SIN_CONEXION = 'No pudimos conectarnos con el servidor. Probá de nuevo en un momento.';

type ResultadoCanje =
  | { tipo: 'exito'; cupon: CanjeExitosoRespuesta }
  | { tipo: 'error'; mensaje: string };

/**
 * Panel del empleado: ingresa el token o escanea el QR del cliente, VALIDA el cupón
 * (el servidor muestra a qué cupón y usuario corresponde) y recién después lo canjea.
 * La validación y el canje los decide siempre el servidor.
 */
@Component({
  selector: 'app-empleado-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, ModalResultado, GeneradorCodigoSobre, LectorQr],
  templateUrl: './empleado-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrarModales()' },
})
export class EmpleadoDashboard {
  readonly authService = inject(AuthService);
  private readonly cuponesService = inject(CuponesService);
  private readonly router = inject(Router);

  protected readonly urlLogo = urlLogoBlanco;

  protected readonly codigo = signal('');
  protected readonly enviando = signal(false);
  protected readonly resultado = signal<ResultadoCanje | null>(null);
  /** Cupón verificado por el servidor, pendiente de confirmar el canje. */
  protected readonly validacion = signal<CuponValidado | null>(null);
  protected readonly menuAbierto = signal(false);

  constructor() {
    const raiz = document.documentElement;
    const modoPrevio = raiz.getAttribute('data-modo');
    raiz.setAttribute('data-modo', 'empresa');

    inject(DestroyRef).onDestroy(() => {
      if (modoPrevio) raiz.setAttribute('data-modo', modoPrevio);
      else raiz.removeAttribute('data-modo');
    });
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

  /** El QR leído por la cámara va directo a validar (no pasa por el campo de texto). */
  protected alLeerQr(contenido: string): void {
    this.codigo.set(contenido.trim().toUpperCase());
    this.validar();
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private mensajeDeError(respuesta: HttpErrorResponse): string {
    if (respuesta.status === 0 || respuesta.status >= 500) return MENSAJE_SIN_CONEXION;
    const cuerpo = respuesta.error as Partial<CanjeErrorRespuesta> | null;
    return cuerpo?.mensaje ?? MENSAJE_CODIGO_INVALIDO;
  }
}