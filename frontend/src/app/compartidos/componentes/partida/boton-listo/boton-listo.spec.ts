import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BotonListo } from './boton-listo';

describe('BotonListo', () => {
  let fixture: ComponentFixture<BotonListo>;

  const boton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BotonListo] });
    fixture = TestBed.createComponent(BotonListo);
  });

  it('en "jugando" muestra "Finalizar turno" y emite al apretar', () => {
    const emitido = jest.fn();
    fixture.componentInstance.listo.subscribe(emitido);
    fixture.detectChanges();

    expect(boton().textContent).toContain('Finalizar turno');
    boton().click();
    expect(emitido).toHaveBeenCalledTimes(1);
  });

  it('en "esperando" está deshabilitado, con aria-busy y no emite', () => {
    const emitido = jest.fn();
    fixture.componentInstance.listo.subscribe(emitido);
    fixture.componentRef.setInput('estado', 'esperando');
    fixture.detectChanges();

    expect(boton().textContent).toContain('Esperando');
    expect(boton().getAttribute('aria-busy')).toBe('true');
    expect(boton().hasAttribute('disabled')).toBe(true);
    boton().click();
    expect(emitido).not.toHaveBeenCalled();
  });

  it('en "resolviendo" está deshabilitado y no emite', () => {
    const emitido = jest.fn();
    fixture.componentInstance.listo.subscribe(emitido);
    fixture.componentRef.setInput('estado', 'resolviendo');
    fixture.detectChanges();

    expect(boton().textContent).toContain('Resolviendo');
    expect(boton().hasAttribute('disabled')).toBe(true);
    boton().click();
    expect(emitido).not.toHaveBeenCalled();
  });
});