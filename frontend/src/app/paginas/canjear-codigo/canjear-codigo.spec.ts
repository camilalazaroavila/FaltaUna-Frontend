import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Header } from '@compartidos/componentes/layout/header/header';
import { CodigosSobreService } from '@servicios/codigos-sobre.service';
import { CanjeCodigoSobreRespuesta } from '@modelos/codigo-sobre.model';
import { CanjearCodigo } from './canjear-codigo';
import { By } from '@angular/platform-browser';
import { LectorQr } from '@compartidos/componentes/usuario/lector-qr/lector-qr';

const CANJE: CanjeCodigoSobreRespuesta = {
    mensaje: '¡Listo! Sumaste "Sobre Burger King" a tu inventario.',
    marca: 'Burger King',
    sobreId: 11,
    sobre: 'Sobre Burger King',
};

function crear(canjear: (codigo: string) => Observable<CanjeCodigoSobreRespuesta>) {
    TestBed.configureTestingModule({
        providers: [provideRouter([]), { provide: CodigosSobreService, useValue: { canjear } }],
    });
    // Se saca el encabezado real (tiene sus propias dependencias) para probar solo esta pantalla.
    TestBed.overrideComponent(CanjearCodigo, {
        remove: { imports: [Header] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    const fixture = TestBed.createComponent(CanjearCodigo);
    fixture.detectChanges();
    return fixture;
}

type Fixture = ReturnType<typeof crear>;

const raiz = (fixture: Fixture) => fixture.nativeElement as HTMLElement;
const texto = (fixture: Fixture) => raiz(fixture).textContent ?? '';
const campo = (fixture: Fixture) => raiz(fixture).querySelector('input') as HTMLInputElement;
const boton = (fixture: Fixture) => raiz(fixture).querySelector('button') as HTMLButtonElement;

function escribir(fixture: Fixture, valor: string): void {
    campo(fixture).value = valor;
    campo(fixture).dispatchEvent(new Event('input'));
    fixture.detectChanges();
}

function enviar(fixture: Fixture): void {
    raiz(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
}


function leerQr(fixture: Fixture, contenido: string): void {
    fixture.debugElement.query(By.directive(LectorQr)).triggerEventHandler('leido', contenido);
    fixture.detectChanges();
}

describe('CanjearCodigo', () => {
    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('al inicio muestra el campo y el botón, sin ningún mensaje', () => {
        const fixture = crear(() => of(CANJE));

        expect(campo(fixture)).not.toBeNull();
        expect(boton(fixture).textContent).toContain('Canjear sobre');
        expect(raiz(fixture).querySelector('[role="status"]')).toBeNull();
        expect(raiz(fixture).querySelector('[role="alert"]')).toBeNull();
    });

    it('canjea el código escrito (sin espacios de más), muestra el resultado y limpia el campo', () => {
        const canjear = jest.fn(() => of(CANJE));
        const fixture = crear(canjear);

        escribir(fixture, '  k7md-4xq9 ');
        enviar(fixture);

        expect(canjear).toHaveBeenCalledWith('k7md-4xq9');
        expect(raiz(fixture).querySelector('[role="status"]')?.textContent).toContain(
            'Sumaste "Sobre Burger King"',
        );
        expect(texto(fixture)).toContain('Ir a abrir mis sobres');
        expect(campo(fixture).value).toBe('');
    });

    it.each(['', '   '])('con el campo vacío ("%s") avisa y no llama al servidor', (valor) => {
        const canjear = jest.fn(() => of(CANJE));
        const fixture = crear(canjear);

        escribir(fixture, valor);
        enviar(fixture);

        expect(raiz(fixture).querySelector('[role="alert"]')?.textContent).toContain(
            'Ingresá el código que te dio el empleado.',
        );
        expect(canjear).not.toHaveBeenCalled();
    });

    it('muestra el mensaje del servidor y conserva lo escrito cuando falla', () => {
        const mensaje = 'Ya canjeaste un sobre de esta marca hoy. Volvé mañana.';
        const fixture = crear(() =>
            throwError(() => new HttpErrorResponse({ status: 400, error: { mensaje } })),
        );

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);

        expect(raiz(fixture).querySelector('[role="alert"]')?.textContent).toContain(mensaje);
        expect(campo(fixture).value).toBe('K7MD-4XQ9');
        expect(boton(fixture).disabled).toBe(false);
    });

    it.each([0, 500, 503])('con estado %i avisa que no hay conexión', (status) => {
        const fixture = crear(() => throwError(() => new HttpErrorResponse({ status })));

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);

        expect(texto(fixture)).toContain('No pudimos conectarnos con el servidor');
    });

    it('si el error no trae mensaje usa uno genérico', () => {
        const fixture = crear(() =>
            throwError(() => new HttpErrorResponse({ status: 400, error: null })),
        );

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);

        expect(texto(fixture)).toContain('No pudimos canjear el código');
    });

    it('mientras espera la respuesta deshabilita el botón y no manda el código dos veces', () => {
        const canjear = jest.fn(() => new Subject<CanjeCodigoSobreRespuesta>());
        const fixture = crear(canjear);

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);
        expect(boton(fixture).disabled).toBe(true);
        expect(boton(fixture).textContent).toContain('Canjeando');

        enviar(fixture);
        expect(canjear).toHaveBeenCalledTimes(1);
    });

    it('un nuevo intento borra el mensaje anterior', () => {
        const respuestas = [
            throwError(() => new HttpErrorResponse({ status: 400, error: { mensaje: 'Código vencido.' } })),
            of(CANJE),
        ];
        const fixture = crear(() => respuestas.shift()!);

        escribir(fixture, 'AAAA-BBBB');
        enviar(fixture);
        expect(texto(fixture)).toContain('Código vencido.');

        escribir(fixture, 'CCCC-DDDD');
        enviar(fixture);

        expect(texto(fixture)).not.toContain('Código vencido.');
        expect(texto(fixture)).toContain('Sumaste "Sobre Burger King"');
    });


    it('incluye el lector de QR, que solo se ve si el dispositivo puede escanear', () => {
        const fixture = crear(() => of(CANJE));

        expect(raiz(fixture).querySelector('app-lector-qr')).not.toBeNull();
    });

    it('al leer un QR canjea lo leído sin pasar por el campo de texto', () => {
        const canjear = jest.fn(() => of(CANJE));
        const fixture = crear(canjear);

        leerQr(fixture, 'FALTAUNA:SOBRE:ABC123');

        expect(canjear).toHaveBeenCalledWith('FALTAUNA:SOBRE:ABC123');
        expect(raiz(fixture).querySelector('[role="status"]')?.textContent).toContain(
            'Sumaste "Sobre Burger King"',
        );
    });

    it('si el QR leído no se puede canjear muestra el mensaje del servidor y no toca el campo', () => {
        const mensaje = 'Ese QR es de un cupón de descuento: mostráselo al empleado para que lo canjee.';
        const fixture = crear(() =>
            throwError(() => new HttpErrorResponse({ status: 400, error: { mensaje } })),
        );
        escribir(fixture, 'LO-QUE-ESCRIBI');

        leerQr(fixture, 'FALTAUNA:COUPON:XYZ');

        expect(raiz(fixture).querySelector('[role="alert"]')?.textContent).toContain(mensaje);
        expect(campo(fixture).value).toBe('LO-QUE-ESCRIBI');
    });

});