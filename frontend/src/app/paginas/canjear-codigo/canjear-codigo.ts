import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Header } from '@compartidos/componentes/layout/header/header';
import { LectorQr } from '@compartidos/componentes/usuario/lector-qr/lector-qr';
import { CodigosSobreService } from '@servicios/codigos-sobre.service';
import { CanjeCodigoSobreRespuesta } from '@modelos/codigo-sobre.model';

const MENSAJE_SIN_CODIGO = 'Ingresá el código que te dio el empleado.';
const MENSAJE_SIN_CONEXION = 'No pudimos conectarnos con el servidor. Probá de nuevo en un momento.';
const MENSAJE_GENERICO = 'No pudimos canjear el código. Revisalo e intentá de nuevo.';

type Resultado =
    | { tipo: 'exito'; canje: CanjeCodigoSobreRespuesta }
    | { tipo: 'error'; mensaje: string };

/**
 * El usuario canjea el código que le da un empleado en el local y recibe un sobre de esa marca
 * en su inventario. Puede escanear el QR con la cámara (si su dispositivo lo permite) o escribir
 * el código. El servidor valida todo (vencimiento, uso único, límite de 1 por marca y por día).
 */
@Component({
    selector: 'app-canjear-codigo',
    standalone: true,
    imports: [RouterLink, Header, LectorQr],
    templateUrl: './canjear-codigo.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanjearCodigo {
    private readonly servicio = inject(CodigosSobreService);

    protected readonly codigo = signal('');
    protected readonly enviando = signal(false);
    protected readonly resultado = signal<Resultado | null>(null);

    protected alEscribir(evento: Event): void {
        this.codigo.set((evento.target as HTMLInputElement).value);
    }

    protected canjear(evento?: Event): void {
        evento?.preventDefault();
        this.enviar(this.codigo());
    }

    /** El QR se canjea directo: lo que lee la cámara no pasa por el campo de texto. */
    protected alLeerQr(contenido: string): void {
        this.enviar(contenido);
    }

    private enviar(codigoIngresado: string): void {
        if (this.enviando()) return;

        const valor = codigoIngresado.trim();
        if (valor.length === 0) {
            this.resultado.set({ tipo: 'error', mensaje: MENSAJE_SIN_CODIGO });
            return;
        }

        this.enviando.set(true);
        this.resultado.set(null);

        this.servicio.canjear(valor).subscribe({
            next: (canje) => {
                this.enviando.set(false);
                this.codigo.set('');
                this.resultado.set({ tipo: 'exito', canje });
            },
            error: (respuesta: HttpErrorResponse) => {
                this.enviando.set(false);
                this.resultado.set({ tipo: 'error', mensaje: this.mensajeDeError(respuesta) });
            },
        });
    }

    private mensajeDeError(respuesta: HttpErrorResponse): string {
        if (respuesta.status === 0 || respuesta.status >= 500) return MENSAJE_SIN_CONEXION;
        const cuerpo = respuesta.error as { mensaje?: string } | null;
        return cuerpo?.mensaje ?? MENSAJE_GENERICO;
    }
}