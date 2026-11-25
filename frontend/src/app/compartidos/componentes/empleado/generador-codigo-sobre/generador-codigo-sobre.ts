import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    inject,
    signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CodigosSobreService } from '@servicios/codigos-sobre.service';
import { CodigoSobreGenerado } from '@modelos/codigo-sobre.model';

const MENSAJE_SIN_CONEXION = 'No pudimos conectarnos con el servidor. Probá de nuevo en un momento.';
const MENSAJE_GENERICO = 'No pudimos generar el código. Probá de nuevo.';

/**
 * Panel del empleado para regalar un sobre de su marca: genera un QR y un código corto
 * que vencen a los pocos minutos. El cliente los canjea desde su app.
 * El servidor decide todo (qué sobre es, cuánto dura); acá solo se muestra y se cuenta el tiempo.
 */
@Component({
    selector: 'app-generador-codigo-sobre',
    standalone: true,
    templateUrl: './generador-codigo-sobre.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneradorCodigoSobre {
    private readonly servicio = inject(CodigosSobreService);

    protected readonly codigo = signal<CodigoSobreGenerado | null>(null);
    protected readonly generando = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly segundosRestantes = signal(0);

    protected readonly vencido = computed(
        () => this.codigo() !== null && this.segundosRestantes() <= 0,
    );

    /** Tiempo que queda, con formato m:ss. */
    protected readonly tiempoRestante = computed(() => {
        const total = Math.max(this.segundosRestantes(), 0);
        const minutos = Math.floor(total / 60);
        const segundos = total % 60;
        return `${minutos}:${segundos.toString().padStart(2, '0')}`;
    });

    private temporizador: ReturnType<typeof setInterval> | null = null;

    constructor() {
        inject(DestroyRef).onDestroy(() => this.detenerTemporizador());
    }

    protected generar(): void {
        if (this.generando()) return;

        this.detenerTemporizador();
        this.codigo.set(null);
        this.error.set(null);
        this.generando.set(true);

        this.servicio.generar().subscribe({
            next: (generado) => {
                this.generando.set(false);
                this.codigo.set(generado);
                this.iniciarCuentaRegresiva(generado.duracionSegundos);
            },
            error: (respuesta: HttpErrorResponse) => {
                this.generando.set(false);
                this.error.set(this.mensajeDeError(respuesta));
            },
        });
    }

    /** Se cuenta desde que llega la respuesta, así no depende de que los relojes coincidan. */
    private iniciarCuentaRegresiva(duracionSegundos: number): void {
        const vence = Date.now() + duracionSegundos * 1000;

        const actualizar = () => {
            const restante = Math.ceil((vence - Date.now()) / 1000);
            this.segundosRestantes.set(Math.max(restante, 0));
            if (restante <= 0) this.detenerTemporizador();
        };

        actualizar();
        this.temporizador = setInterval(actualizar, 1000);
    }

    private detenerTemporizador(): void {
        if (this.temporizador !== null) {
            clearInterval(this.temporizador);
            this.temporizador = null;
        }
    }

    private mensajeDeError(respuesta: HttpErrorResponse): string {
        if (respuesta.status === 0 || respuesta.status >= 500) return MENSAJE_SIN_CONEXION;
        const cuerpo = respuesta.error as { mensaje?: string } | null;
        return cuerpo?.mensaje ?? MENSAJE_GENERICO;
    }
}