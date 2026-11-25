import { TestBed } from '@angular/core/testing';
import jsQR from 'jsqr';
import { LectorQr } from './lector-qr';

jest.mock('jsqr', () => ({ __esModule: true, default: jest.fn() }));
const jsQRMock = jsQR as unknown as jest.Mock;

type Ventana = { BarcodeDetector?: unknown };

const esperar = (ms = 20) => new Promise<void>((resolver) => setTimeout(resolver, ms));

/** Simula un navegador que deja usar la cámara; con `conLectorNativo` además trae BarcodeDetector. */
function instalarNavegadorConCamara(detect: jest.Mock, conLectorNativo = true) {
    const pista = { stop: jest.fn() };
    const flujo = { getTracks: () => [pista] } as unknown as MediaStream;
    const getUserMedia = jest.fn().mockResolvedValue(flujo);

    Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia },
        configurable: true,
    });
    if (conLectorNativo) {
        (window as unknown as Ventana).BarcodeDetector = jest
            .fn()
            .mockImplementation(() => ({ detect }));
    }
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

    return { pista, flujo, getUserMedia };
}

/** Simula el video y el lienzo (jsdom no los implementa) para probar la lectura con jsQR. */
function prepararLienzo(ancho = 640, alto = 480) {
    const contexto = {
        drawImage: jest.fn(),
        getImageData: jest
            .fn()
            .mockReturnValue({ data: new Uint8ClampedArray(4), width: ancho, height: alto }),
    };
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext') as unknown as jest.Mock;
    getContext.mockReturnValue(contexto);
    const anchoVideo = jest
        .spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get')
        .mockReturnValue(ancho);
    jest.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockReturnValue(alto);

    return { contexto, getContext, anchoVideo };
}

function crear() {
    const fixture = TestBed.createComponent(LectorQr);
    fixture.detectChanges();
    return fixture;
}

type Fixture = ReturnType<typeof crear>;

const raiz = (fixture: Fixture) => fixture.nativeElement as HTMLElement;
const botones = (fixture: Fixture) => Array.from(raiz(fixture).querySelectorAll('button'));
const textoBotones = (fixture: Fixture) => botones(fixture).map((b) => b.textContent?.trim());
const iniciar = (fixture: Fixture) =>
    (fixture.componentInstance as unknown as { iniciar(): Promise<void> }).iniciar();

async function tocarEscanear(fixture: Fixture, espera = 20): Promise<void> {
    botones(fixture)[0].click();
    await esperar(espera);
    fixture.detectChanges();
}

function escucharLecturas(fixture: Fixture): string[] {
    const leidos: string[] = [];
    fixture.componentInstance.leido.subscribe((contenido) => leidos.push(contenido));
    return leidos;
}

describe('LectorQr', () => {
    afterEach(() => {
        TestBed.resetTestingModule();
        delete (window as unknown as Ventana).BarcodeDetector;
        Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
        jsQRMock.mockReset();
        jest.restoreAllMocks();
    });

    it('si el dispositivo no da acceso a la cámara no muestra nada', () => {
        const fixture = crear();

        expect(botones(fixture)).toHaveLength(0);
        expect(raiz(fixture).textContent?.trim()).toBe('');
    });

    it('si el navegador tiene lector de QR pero no da acceso a la cámara tampoco muestra nada', () => {
        (window as unknown as Ventana).BarcodeDetector = jest.fn();

        const fixture = crear();

        expect(botones(fixture)).toHaveLength(0);
    });

    it('si el dispositivo da acceso a la cámara, ofrece escanear', () => {
        instalarNavegadorConCamara(jest.fn());

        const fixture = crear();

        expect(textoBotones(fixture)).toEqual(['Escanear QR con la cámara']);
    });

    it('también ofrece escanear si el navegador no trae lector de QR (iPhone)', () => {
        instalarNavegadorConCamara(jest.fn(), false);

        const fixture = crear();

        expect(textoBotones(fixture)).toEqual(['Escanear QR con la cámara']);
    });

    it('al tocar pide la cámara trasera y muestra el video con la opción de cancelar', async () => {
        const { getUserMedia } = instalarNavegadorConCamara(jest.fn(() => new Promise(() => { })));
        const fixture = crear();

        await tocarEscanear(fixture);

        expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'environment' } });
        expect(raiz(fixture).querySelector('video')).not.toBeNull();
        expect(textoBotones(fixture)).toEqual(['Cancelar']);
    });

    it('con el lector del navegador: cuando lee un QR lo avisa, apaga la cámara y vuelve al botón', async () => {
        const detect = jest.fn().mockResolvedValue([{ rawValue: 'FALTAUNA:SOBRE:ABC123' }]);
        const { pista } = instalarNavegadorConCamara(detect);
        const fixture = crear();
        const leidos = escucharLecturas(fixture);

        await tocarEscanear(fixture);

        expect(leidos).toEqual(['FALTAUNA:SOBRE:ABC123']);
        expect(pista.stop).toHaveBeenCalledTimes(1);
        expect(raiz(fixture).querySelector('video')).toBeNull();
        expect(textoBotones(fixture)).toEqual(['Escanear QR con la cámara']);
        expect(jsQRMock).not.toHaveBeenCalled();
    });

    it('si en un cuadro no hay QR sigue intentando con el siguiente', async () => {
        const detect = jest
            .fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ rawValue: 'SEGUNDO-INTENTO' }]);
        instalarNavegadorConCamara(detect);
        const fixture = crear();
        const leidos = escucharLecturas(fixture);

        await tocarEscanear(fixture, 320);

        expect(detect).toHaveBeenCalledTimes(2);
        expect(leidos).toEqual(['SEGUNDO-INTENTO']);
    });

    it('un cuadro que no se pudo analizar no corta el escaneo', async () => {
        const detect = jest
            .fn()
            .mockRejectedValueOnce(new Error('cuadro ilegible'))
            .mockResolvedValueOnce([{ rawValue: 'DESPUES-DEL-ERROR' }]);
        instalarNavegadorConCamara(detect);
        const fixture = crear();
        const leidos = escucharLecturas(fixture);

        await tocarEscanear(fixture, 320);

        expect(leidos).toEqual(['DESPUES-DEL-ERROR']);
    });

    it('sin lector del navegador lee el QR con jsQR', async () => {
        const { pista } = instalarNavegadorConCamara(jest.fn(), false);
        prepararLienzo();
        jsQRMock.mockReturnValue({ data: 'FALTAUNA:SOBRE:EN-IPHONE' });
        const fixture = crear();
        const leidos = escucharLecturas(fixture);

        await tocarEscanear(fixture);

        expect(leidos).toEqual(['FALTAUNA:SOBRE:EN-IPHONE']);
        expect(jsQRMock).toHaveBeenCalledWith(expect.any(Uint8ClampedArray), 640, 480, {
            inversionAttempts: 'dontInvert',
        });
        expect(pista.stop).toHaveBeenCalledTimes(1);
        expect(textoBotones(fixture)).toEqual(['Escanear QR con la cámara']);
    });

    it('con jsQR, si en un cuadro no hay QR sigue intentando con el siguiente', async () => {
        instalarNavegadorConCamara(jest.fn(), false);
        prepararLienzo();
        jsQRMock.mockReturnValueOnce(null).mockReturnValueOnce({ data: 'SEGUNDO-CUADRO' });
        const fixture = crear();
        const leidos = escucharLecturas(fixture);

        await tocarEscanear(fixture, 320);

        expect(jsQRMock).toHaveBeenCalledTimes(2);
        expect(leidos).toEqual(['SEGUNDO-CUADRO']);
    });

    it('con jsQR, mientras el video no tiene imagen no analiza nada y espera al siguiente cuadro', async () => {
        instalarNavegadorConCamara(jest.fn(), false);
        const { anchoVideo } = prepararLienzo();
        anchoVideo.mockReturnValueOnce(0).mockReturnValue(640);
        jsQRMock.mockReturnValue({ data: 'YA-HAY-IMAGEN' });
        const fixture = crear();
        const leidos = escucharLecturas(fixture);

        await tocarEscanear(fixture, 320);

        expect(jsQRMock).toHaveBeenCalledTimes(1);
        expect(leidos).toEqual(['YA-HAY-IMAGEN']);
    });

    it('con jsQR, achica los cuadros grandes antes de analizarlos', async () => {
        instalarNavegadorConCamara(jest.fn(), false);
        const { contexto } = prepararLienzo(1280, 720);
        jsQRMock.mockReturnValue({ data: 'QR-GRANDE' });
        const fixture = crear();

        await tocarEscanear(fixture);

        expect(contexto.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 360);
    });

    it('con jsQR, si el lienzo no está disponible lo reintenta en el siguiente cuadro', async () => {
        instalarNavegadorConCamara(jest.fn(), false);
        const { contexto, getContext } = prepararLienzo();
        getContext.mockReturnValueOnce(null).mockReturnValue(contexto);
        jsQRMock.mockReturnValue({ data: 'RECUPERADO' });
        const fixture = crear();
        const leidos = escucharLecturas(fixture);

        await tocarEscanear(fixture, 320);

        expect(jsQRMock).toHaveBeenCalledTimes(1);
        expect(leidos).toEqual(['RECUPERADO']);
    });

    it('cancelar apaga la cámara, vuelve al botón y no avisa ninguna lectura', async () => {
        const { pista } = instalarNavegadorConCamara(jest.fn().mockResolvedValue([]));
        const fixture = crear();
        const leidos = escucharLecturas(fixture);
        await tocarEscanear(fixture);

        botones(fixture)[0].click();
        fixture.detectChanges();

        expect(pista.stop).toHaveBeenCalledTimes(1);
        expect(textoBotones(fixture)).toEqual(['Escanear QR con la cámara']);
        expect(leidos).toEqual([]);
    });

    it('si el usuario niega el permiso de la cámara muestra un aviso y deja reintentar', async () => {
        const { getUserMedia } = instalarNavegadorConCamara(jest.fn());
        getUserMedia.mockImplementation(async () => {
            throw new Error('denegado');
        });
        const fixture = crear();

        await tocarEscanear(fixture);

        expect(raiz(fixture).querySelector('[role="alert"]')?.textContent).toContain(
            'No pudimos acceder a la cámara',
        );
        expect(textoBotones(fixture)).toEqual(['Escanear QR con la cámara']);
    });

    it('si el video no arranca muestra el aviso y apaga la cámara', async () => {
        const { pista } = instalarNavegadorConCamara(jest.fn());
        jest.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('bloqueado'));
        const fixture = crear();

        await tocarEscanear(fixture);

        expect(raiz(fixture).querySelector('[role="alert"]')?.textContent).toContain(
            'No pudimos acceder a la cámara',
        );
        expect(pista.stop).toHaveBeenCalledTimes(1);
        expect(textoBotones(fixture)).toEqual(['Escanear QR con la cámara']);
    });

    it('un segundo toque mientras espera el permiso no abre la cámara dos veces', async () => {
        const { getUserMedia } = instalarNavegadorConCamara(jest.fn(() => new Promise(() => { })));
        const fixture = crear();

        void iniciar(fixture);
        void iniciar(fixture);
        await esperar();

        expect(getUserMedia).toHaveBeenCalledTimes(1);
    });

    it('si la pantalla se cierra mientras se pide el permiso, libera la cámara y no sigue', async () => {
        const detect = jest.fn();
        const { pista, flujo, getUserMedia } = instalarNavegadorConCamara(detect);
        let entregarCamara!: (flujo: MediaStream) => void;
        getUserMedia.mockReturnValue(
            new Promise<MediaStream>((resolver) => (entregarCamara = resolver)),
        );
        const fixture = crear();

        const pendiente = iniciar(fixture);
        fixture.destroy();
        entregarCamara(flujo);
        await pendiente;

        expect(pista.stop).toHaveBeenCalledTimes(1);
        expect(detect).not.toHaveBeenCalled();
    });

    it('al destruirse apaga la cámara que estuviera en uso', async () => {
        const { pista } = instalarNavegadorConCamara(jest.fn(() => new Promise(() => { })));
        const fixture = crear();
        await tocarEscanear(fixture);

        fixture.destroy();

        expect(pista.stop).toHaveBeenCalledTimes(1);
    });
});