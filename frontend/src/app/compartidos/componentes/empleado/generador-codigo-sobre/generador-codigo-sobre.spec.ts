import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, of, throwError } from 'rxjs';
import { CodigosSobreService } from '@servicios/codigos-sobre.service';
import { CodigoSobreGenerado } from '@modelos/codigo-sobre.model';
import { GeneradorCodigoSobre } from './generador-codigo-sobre';

const GENERADO: CodigoSobreGenerado = {
    marca: "McDonald's",
    sobre: "Sobre McDonald's",
    codigo: 'WBWV-KC8Q',
    qrDataUrl: 'data:image/png;base64,iVBORw0K',
    vencimientoUtc: '2026-11-20T15:02:00Z',
    duracionSegundos: 120,
};

function crear(generar: () => Observable<CodigoSobreGenerado>) {
    TestBed.configureTestingModule({
        providers: [{ provide: CodigosSobreService, useValue: { generar } }],
    });
    const fixture = TestBed.createComponent(GeneradorCodigoSobre);
    fixture.detectChanges();
    return fixture;
}

type Fixture = ReturnType<typeof crear>;

const raiz = (fixture: Fixture) => fixture.nativeElement as HTMLElement;
const texto = (fixture: Fixture) => raiz(fixture).textContent ?? '';
const boton = (fixture: Fixture) => raiz(fixture).querySelector('button') as HTMLButtonElement;

function tocarBoton(fixture: Fixture): void {
    boton(fixture).click();
    fixture.detectChanges();
}

describe('GeneradorCodigoSobre', () => {
    afterEach(() => {
        // Primero se destruye el componente (corta su temporizador) y recién después se vuelve al reloj real.
        TestBed.resetTestingModule();
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('al inicio solo muestra el botón para generar', () => {
        const fixture = crear(() => of(GENERADO));

        expect(boton(fixture).textContent).toContain('Generar QR de sobre');
        expect(raiz(fixture).querySelector('img')).toBeNull();
    });

    it('al generar muestra el QR, el código y el tiempo que queda', () => {
        jest.useFakeTimers();
        const fixture = crear(() => of(GENERADO));

        tocarBoton(fixture);

        const imagen = raiz(fixture).querySelector('img') as HTMLImageElement;
        expect(imagen.getAttribute('src')).toBe(GENERADO.qrDataUrl);
        expect(imagen.getAttribute('alt')).toBe("Código QR del sobre de McDonald's");
        expect(texto(fixture)).toContain('WBWV-KC8Q');
        expect(texto(fixture)).toContain("Sobre McDonald's");
        expect(texto(fixture)).toContain('Vence en 2:00');
        expect(boton(fixture).textContent).toContain('Generar otro QR');
    });

    it('cuenta hacia atrás y avisa cuando el código venció', () => {
        jest.useFakeTimers();
        const limpiar = jest.spyOn(globalThis, 'clearInterval');
        const fixture = crear(() => of(GENERADO));
        tocarBoton(fixture);

        jest.advanceTimersByTime(61_000);
        fixture.detectChanges();
        expect(texto(fixture)).toContain('Vence en 0:59');
        expect(limpiar).not.toHaveBeenCalled();

        jest.advanceTimersByTime(59_000);
        fixture.detectChanges();
        expect(texto(fixture)).toContain('Este código venció');
        expect(texto(fixture)).not.toContain('Vence en');
        // Al llegar a cero el componente corta su temporizador.
        expect(limpiar).toHaveBeenCalledTimes(1);
    });

    it('generar otro reemplaza el código anterior y reinicia la cuenta', () => {
        jest.useFakeTimers();
        const limpiar = jest.spyOn(globalThis, 'clearInterval');
        const fixture = crear(() => of(GENERADO));
        tocarBoton(fixture);
        jest.advanceTimersByTime(30_000);
        fixture.detectChanges();
        expect(texto(fixture)).toContain('Vence en 1:30');

        tocarBoton(fixture);

        expect(texto(fixture)).toContain('Vence en 2:00');
        // El temporizador del código anterior se cortó antes de arrancar el nuevo.
        expect(limpiar).toHaveBeenCalledTimes(1);
    });

    it('mientras genera deshabilita el botón y no pide dos códigos', () => {
        const generar = jest.fn(() => new Subject<CodigoSobreGenerado>());
        const fixture = crear(generar);

        tocarBoton(fixture);
        expect(boton(fixture).disabled).toBe(true);
        expect(boton(fixture).textContent).toContain('Generando');

        // Un segundo llamado mientras espera la respuesta no hace nada.
        (fixture.componentInstance as unknown as { generar(): void }).generar();
        expect(generar).toHaveBeenCalledTimes(1);
    });

    it('muestra el mensaje del servidor cuando falla', () => {
        const mensaje = 'Tu marca todavía no tiene un sobre configurado para entregar.';
        const fixture = crear(() =>
            throwError(() => new HttpErrorResponse({ status: 400, error: { mensaje } })),
        );

        tocarBoton(fixture);

        expect(raiz(fixture).querySelector('[role="alert"]')?.textContent).toContain(mensaje);
        expect(raiz(fixture).querySelector('img')).toBeNull();
        expect(boton(fixture).disabled).toBe(false);
    });

    it.each([0, 500, 503])('con estado %i avisa que no hay conexión', (status) => {
        const fixture = crear(() => throwError(() => new HttpErrorResponse({ status })));

        tocarBoton(fixture);

        expect(texto(fixture)).toContain('No pudimos conectarnos con el servidor');
    });

    it('si el error no trae mensaje usa uno genérico', () => {
        const fixture = crear(() =>
            throwError(() => new HttpErrorResponse({ status: 400, error: null })),
        );

        tocarBoton(fixture);

        expect(texto(fixture)).toContain('No pudimos generar el código');
    });

    it('al destruirse corta el temporizador', () => {
        jest.useFakeTimers();
        const limpiar = jest.spyOn(globalThis, 'clearInterval');
        const fixture = crear(() => of(GENERADO));
        tocarBoton(fixture);
        expect(limpiar).not.toHaveBeenCalled();

        fixture.destroy();

        expect(limpiar).toHaveBeenCalledTimes(1);
    });
});