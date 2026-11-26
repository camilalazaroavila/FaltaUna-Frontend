import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    ElementRef,
    inject,
    output,
    signal,
    viewChild,
} from '@angular/core';
import jsQR from 'jsqr';

/** API del navegador (Chrome/Android) para leer QR sin librerías; no está en los tipos de TS. */
interface DetectorBarcode {
    detect(fuente: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type ConstructorDetector = new (opciones: { formats: string[] }) => DetectorBarcode;

/** Analiza un cuadro del video y devuelve lo que dice el QR, o null si no encontró ninguno. */
type LectorDeCuadro = (video: HTMLVideoElement) => Promise<string | null>;

const MENSAJE_SIN_CAMARA = 'No pudimos acceder a la cámara. Revisá los permisos del navegador.';
const INTERVALO_MS = 250;
/** jsQR trabaja píxel por píxel en JavaScript: se achica el cuadro para que ande fluido en celulares. */
const ANCHO_MAXIMO_PX = 640;

/**
 * Lee un código QR con la cámara trasera y avisa el contenido leído.
 * Usa el lector del propio navegador cuando lo tiene (Chrome en Android) y, si no (Safari en iPhone,
 * por ejemplo), lo decodifica con jsQR. Si el dispositivo no da acceso a la cámara no muestra nada:
 * la pantalla que lo usa tiene que ofrecer siempre una alternativa para escribir el código.
 */
@Component({
    selector: 'app-lector-qr',
    standalone: true,
    templateUrl: './lector-qr.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LectorQr {
    /** Contenido del QR leído. Al emitirse, la cámara ya se apagó. */
    readonly leido = output<string>();

    protected readonly disponible =
        typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    protected readonly escaneando = signal(false);
    protected readonly error = signal<string | null>(null);

    private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
    private readonly cdr = inject(ChangeDetectorRef);

    private flujo: MediaStream | null = null;
    private iniciando = false;
    private destruido = false;

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.destruido = true;
            this.detener();
        });
    }

    protected async iniciar(): Promise<void> {
        if (!this.disponible || this.escaneando() || this.iniciando) return;

        this.iniciando = true;
        try {
            await this.abrirCamara();
        } finally {
            this.iniciando = false;
        }
    }

    protected detener(): void {
        this.flujo?.getTracks().forEach((pista) => pista.stop());
        this.flujo = null;
        this.escaneando.set(false);
    }

    private async abrirCamara(): Promise<void> {
        this.error.set(null);

        let flujo: MediaStream;
        try {
            flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        } catch {
            this.error.set(MENSAJE_SIN_CAMARA);
            return;
        }

        // Si la pantalla se cerró mientras se esperaba el permiso, se libera la cámara y no se sigue.
        if (this.destruido) {
            flujo.getTracks().forEach((pista) => pista.stop());
            return;
        }

        this.flujo = flujo;
        this.escaneando.set(true);
        // Se dibuja ahora el <video> para poder conectarle la cámara.
        this.cdr.detectChanges();

        const elemento = this.video()!.nativeElement;
        elemento.srcObject = flujo;
        try {
            await elemento.play();
        } catch {
            this.error.set(MENSAJE_SIN_CAMARA);
            this.detener();
            return;
        }

        void this.leerCuadros(elemento, this.crearLector());
    }

    private crearLector(): LectorDeCuadro {
        if ('BarcodeDetector' in window) {
            const Detector = (window as unknown as { BarcodeDetector: ConstructorDetector })
                .BarcodeDetector;
            const detector = new Detector({ formats: ['qr_code'] });
            return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
        }

        const lienzo = document.createElement('canvas');
        return async (video) => this.leerConJsQr(video, lienzo);
    }

    private leerConJsQr(video: HTMLVideoElement, lienzo: HTMLCanvasElement): string | null {
        const anchoOriginal = video.videoWidth;
        const altoOriginal = video.videoHeight;
        // Mientras la cámara no entregó su primer cuadro, el video todavía no tiene dimensiones.
        if (!anchoOriginal || !altoOriginal) return null;

        const escala = Math.min(1, ANCHO_MAXIMO_PX / anchoOriginal);
        const ancho = Math.round(anchoOriginal * escala);
        const alto = Math.round(altoOriginal * escala);

        lienzo.width = ancho;
        lienzo.height = alto;
        const contexto = lienzo.getContext('2d', { willReadFrequently: true });
        if (!contexto) return null;

        contexto.drawImage(video, 0, 0, ancho, alto);
        const imagen = contexto.getImageData(0, 0, ancho, alto);
        const codigo = jsQR(imagen.data, imagen.width, imagen.height, {
            inversionAttempts: 'dontInvert',
        });
        return codigo?.data ?? null;
    }

    private async leerCuadros(elemento: HTMLVideoElement, leer: LectorDeCuadro): Promise<void> {
        while (this.escaneando() && this.flujo) {
            try {
                const contenido = await leer(elemento);
                if (contenido) {
                    this.detener();
                    this.leido.emit(contenido);
                    return;
                }
            } catch {
                // Un cuadro que no se pudo analizar no corta el escaneo.
            }
            await new Promise((resolver) => setTimeout(resolver, INTERVALO_MS));
        }
    }
}