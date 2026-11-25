import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { GeneradorCodigoSobre } from '@compartidos/componentes/empleado/generador-codigo-sobre/generador-codigo-sobre';
import { CuponesService } from '@servicios/cupones.service';
import { AuthService } from '@servicios/auth.service';
import { Usuario } from '@modelos/usuario.model';
import { CuponValidado, CanjeExitosoRespuesta } from '@modelos/cupon.model';
import { EmpleadoDashboard } from './empleado-dashboard';

const CUPON: CuponValidado = {
    marca: 'Burger King',
    titulo: 'Hamburguesa clásica',
    descripcion: 'Una hamburguesa con queso y papas',
    descuento: 20,
    codigo: 'ABCD-1234',
    vencimientoUtc: '2026-12-31T23:59:59Z',
    usuario: 'juanperez',
};

const CANJE: CanjeExitosoRespuesta = {
    marca: 'Burger King',
    titulo: 'Hamburguesa clásica',
    descripcion: 'Una hamburguesa con queso y papas',
    fechaCanjeUtc: '2026-11-25T20:00:00Z',
};

const MENSAJE_CODIGO_INVALIDO = 'El código que ingresaste es incorrecto o está expirado';
const MENSAJE_SIN_CONEXION = 'No pudimos conectarnos con el servidor';

function crear(
    validar: (codigo: string) => Observable<CuponValidado>,
    canjear: (codigo: string) => Observable<CanjeExitosoRespuesta>,
) {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([]),
            { provide: CuponesService, useValue: { validar, canjear } },
            {
                provide: AuthService,
                useValue: {
                    usuarioActual: signal<Usuario | null>(null),
                    logout: jest.fn(),
                },
            },
        ],
    });
    TestBed.overrideComponent(EmpleadoDashboard, {
        remove: { imports: [GeneradorCodigoSobre] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    const fixture = TestBed.createComponent(EmpleadoDashboard);
    fixture.detectChanges();
    return fixture;
}

type Fixture = ReturnType<typeof crear>;

const raiz = (fixture: Fixture) => fixture.nativeElement as HTMLElement;
const texto = (fixture: Fixture) => raiz(fixture).textContent ?? '';
const campo = (fixture: Fixture) => raiz(fixture).querySelector('input') as HTMLInputElement;
const botonValidar = (fixture: Fixture) =>
    raiz(fixture).querySelector('button[type="submit"]') as HTMLButtonElement;

function escribir(fixture: Fixture, valor: string): void {
    campo(fixture).value = valor;
    campo(fixture).dispatchEvent(new Event('input'));
    fixture.detectChanges();
}

function enviar(fixture: Fixture): void {
    raiz(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
}

describe('EmpleadoDashboard', () => {
    afterEach(() => {
        TestBed.resetTestingModule();
        (window as any).BarcodeDetector = undefined;
        (navigator as any).mediaDevices = undefined;
    });

    it('al inicio muestra el input, el botón Validar y ningún mensaje', () => {
        const fixture = crear(() => of(CUPON), () => of(CANJE));

        expect(campo(fixture)).not.toBeNull();
        expect(botonValidar(fixture).textContent).toContain('Validar');
        expect(botonValidar(fixture).disabled).toBe(true);
        expect(raiz(fixture).querySelector('[role="alert"]')).toBeNull();
        expect(raiz(fixture).querySelector('[role="status"]')).toBeNull();
    });

    it('valida el código (trim + mayúsculas) y muestra el modal de cupón válido', () => {
        const validar = jest.fn(() => of(CUPON));
        const fixture = crear(validar, () => of(CANJE));

        escribir(fixture, ' abcd-1234 ');
        enviar(fixture);

        expect(validar).toHaveBeenCalledWith('ABCD-1234');
        expect(texto(fixture)).toContain('Cupón válido');
        expect(texto(fixture)).toContain(CUPON.marca);
        expect(texto(fixture)).toContain(CUPON.titulo);
        expect(texto(fixture)).toContain(`${CUPON.descuento}%`);
        expect(texto(fixture)).toContain(CUPON.usuario);
        expect(texto(fixture)).toContain(CUPON.codigo);
    });

    it.each(['', '   '])('con el campo vacío ("%s") no llama al servicio y el botón está deshabilitado', (valor) => {
        const validar = jest.fn(() => of(CUPON));
        const fixture = crear(validar, () => of(CANJE));

        escribir(fixture, valor);
        enviar(fixture);

        expect(validar).not.toHaveBeenCalled();
        expect(botonValidar(fixture).disabled).toBe(true);
        expect(raiz(fixture).querySelector('[role="alert"]')).toBeNull();
    });

    it('muestra el mensaje del servidor y conserva lo escrito cuando falla la validación', () => {
        const mensaje = 'Código inválido o expirado';
        const fixture = crear(
            () => throwError(() => new HttpErrorResponse({ status: 400, error: { mensaje } })),
            () => of(CANJE),
        );

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);

        expect(texto(fixture)).toContain(mensaje);
        expect(campo(fixture).value).toBe('K7MD-4XQ9');
        expect(botonValidar(fixture).disabled).toBe(false);
    });

    it.each([0, 500, 503])('con estado %i avisa que no hay conexión', (status) => {
        const fixture = crear(() => throwError(() => new HttpErrorResponse({ status })), () => of(CANJE));

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);

        expect(texto(fixture)).toContain(MENSAJE_SIN_CONEXION);
    });

    it('si el error no trae mensaje usa uno genérico', () => {
        const fixture = crear(
            () => throwError(() => new HttpErrorResponse({ status: 400, error: null })),
            () => of(CANJE),
        );

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);

        expect(texto(fixture)).toContain(MENSAJE_CODIGO_INVALIDO);
    });

    it('mientras espera deshabilita el botón y no valida dos veces', () => {
        const validar = jest.fn(() => new Subject<CuponValidado>());
        const fixture = crear(validar, () => of(CANJE));

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);
        expect(botonValidar(fixture).disabled).toBe(true);

        enviar(fixture);
        expect(validar).toHaveBeenCalledTimes(1);
    });

    it('un nuevo intento genera una nueva validación tras un error', () => {
        const respuestas = [
            throwError(() => new HttpErrorResponse({ status: 400, error: { mensaje: 'Código vencido.' } })),
            of(CUPON),
        ];
        const fixture = crear(() => respuestas.shift()!, () => of(CANJE));

        escribir(fixture, 'AAAA-BBBB');
        enviar(fixture);
        expect(texto(fixture)).toContain('Código vencido.');

        escribir(fixture, 'CCCC-DDDD');
        enviar(fixture);

        expect(texto(fixture)).toContain('Cupón válido');
    });

    it('el botón Escanear QR no se renderiza por defecto (sin BarcodeDetector)', () => {
        const fixture = crear(() => of(CUPON), () => of(CANJE));

        expect(texto(fixture)).not.toContain('Escanear QR');
    });

    it('el botón Escanear QR se renderiza si el dispositivo puede escanear', () => {
        (window as any).BarcodeDetector = jest.fn();
        (navigator as any).mediaDevices = { getUserMedia: jest.fn() };

        const fixture = crear(() => of(CUPON), () => of(CANJE));

        expect(texto(fixture)).toContain('Escanear QR');
    });

    it('confirmar canje consume el cupón y muestra el resultado de éxito', () => {
        const canjear = jest.fn(() => of(CANJE));
        const validar = jest.fn(() => of(CUPON));
        const fixture = crear(validar, canjear);

        escribir(fixture, 'ABCD-1234');
        enviar(fixture);
        expect(texto(fixture)).toContain('Cupón válido');

        const botonConfirmar = Array.from(raiz(fixture).querySelectorAll('button')).find(
            (b) => b.textContent?.includes('Confirmar canje'),
        );
        expect(botonConfirmar).not.toBeNull();
        botonConfirmar.click();
        fixture.detectChanges();

        expect(canjear).toHaveBeenCalledWith('ABCD-1234');
        expect(texto(fixture)).toContain('¡Canjeo exitoso!');
    });

    it('cancelar validación limpia el cupón validado', () => {
        const validar = jest.fn(() => of(CUPON));
        const fixture = crear(validar, () => of(CANJE));

        escribir(fixture, 'ABCD-1234');
        enviar(fixture);
        expect(texto(fixture)).toContain('Cupón válido');

        const botonCerrar = Array.from(raiz(fixture).querySelectorAll('button')).find(
            (b) => b.getAttribute('aria-label') === 'Cerrar',
        );
        expect(botonCerrar).not.toBeNull();
        botonCerrar.click();
        fixture.detectChanges();

        expect(texto(fixture)).not.toContain('Cupón válido');
    });

    it('cerrar resultado limpia el resultado', () => {
        const fixture = crear(
            () => throwError(() => new HttpErrorResponse({ status: 400, error: { mensaje: 'Error' } })),
            () => of(CANJE),
        );

        escribir(fixture, 'K7MD-4XQ9');
        enviar(fixture);
        expect(texto(fixture)).toContain('Hubo un problema');

        const botonCerrar = Array.from(raiz(fixture).querySelectorAll('button')).find(
            (b) => b.getAttribute('aria-label') === 'Cerrar',
        );
        expect(botonCerrar).not.toBeNull();
        botonCerrar.click();
        fixture.detectChanges();

        expect(texto(fixture)).not.toContain('Hubo un problema');
    });

    it('la tecla Escape cierra los modales', () => {
        const validar = jest.fn(() => of(CUPON));
        const fixture = crear(validar, () => of(CANJE));

        escribir(fixture, 'ABCD-1234');
        enviar(fixture);
        expect(texto(fixture)).toContain('Cupón válido');

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();

        expect(texto(fixture)).not.toContain('Cupón válido');
    });

    it('cerrar sesión llama a logout y navega a /login', () => {
        const fixture = crear(() => of(CUPON), () => of(CANJE));
        const authService = TestBed.inject(AuthService) as { logout: jest.Mock };
        const router = TestBed.inject(Router);
        jest.spyOn(router, 'navigate');

        const botonMenu = Array.from(raiz(fixture).querySelectorAll('button')).find(
            (b) => b.getAttribute('aria-label') === 'Menú de perfil',
        );
        expect(botonMenu).not.toBeNull();
        botonMenu.click();
        fixture.detectChanges();

        const botonCerrarSesion = Array.from(raiz(fixture).querySelectorAll('button')).find(
            (b) => b.textContent?.includes('Cerrar sesión'),
        );
        expect(botonCerrarSesion).not.toBeNull();
        botonCerrarSesion.click();
        fixture.detectChanges();

        expect(authService.logout).toHaveBeenCalledTimes(1);
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
});
