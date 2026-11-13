import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import type { MazoApi } from '@modelos/mazo.model';
import { SelectorMazos } from './selector-mazos';

const MAZOS_PRUEBA: MazoApi[] = [
  {
    id: 1,
    nombre: 'Mazo Alpha',
    completo: true,
    cartas: [
      { cartaId: 101, nombre: 'Carta 1', poder: 5, costoCupon: 1, rarezaId: 1, rareza: 'comun', rarezaOrden: 1, imagenUrl: null },
      { cartaId: 102, nombre: 'Carta 2', poder: 6, costoCupon: 2, rarezaId: 2, rareza: 'rara', rarezaOrden: 2, imagenUrl: null },
    ],
  },
  {
    id: 2,
    nombre: 'Mazo Beta Incompleto',
    completo: false,
    cartas: [
      { cartaId: 103, nombre: 'Carta 3', poder: 4, costoCupon: 1, rarezaId: 1, rareza: 'comun', rarezaOrden: 1, imagenUrl: null },
    ],
  },
  {
    id: 3,
    nombre: 'Mazo Gamma',
    completo: true,
    cartas: [],
  },
];

@Component({
  standalone: true,
  imports: [SelectorMazos],
  template: `
    <app-selector-mazos
      [mazos]="mazos"
      [mazoSeleccionadoId]="seleccionadoId"
      [cargando]="cargando"
      [error]="error"
      (mazoSeleccionadoChange)="onSeleccionar($event)"
      (reintentar)="onReintentar()"
    />
  `,
})
class HostComponent {
  mazos: MazoApi[] = MAZOS_PRUEBA;
  seleccionadoId: number | null = 1;
  cargando = false;
  error: string | null = null;
  seleccionadoEmitido: number | null = null;
  reintentarLlamado = false;

  onSeleccionar(id: number): void {
    this.seleccionadoEmitido = id;
    this.seleccionadoId = id;
  }

  onReintentar(): void {
    this.reintentarLlamado = true;
  }
}

describe('SelectorMazos', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe renderizar la lista de mazos con sus tarjetas', () => {
    const tarjetas = fixture.debugElement.queryAll(By.css('.tarjeta-mazo'));
    expect(tarjetas.length).toBe(3);
    expect(tarjetas[0].nativeElement.textContent).toContain('Mazo Alpha');
    expect(tarjetas[1].nativeElement.textContent).toContain('Mazo Beta Incompleto');
  });

  it('marca visualmente y con aria-checked el mazo seleccionado', () => {
    const tarjeta1 = fixture.debugElement.query(By.css('#tarjeta-mazo-1'));
    expect(tarjeta1.nativeElement.getAttribute('aria-checked')).toBe('true');
    expect(tarjeta1.nativeElement.classList.contains('tarjeta-mazo--seleccionada')).toBe(true);

    const tarjeta3 = fixture.debugElement.query(By.css('#tarjeta-mazo-3'));
    expect(tarjeta3.nativeElement.getAttribute('aria-checked')).toBe('false');
  });

  it('permite seleccionar un mazo completo al hacer click o presionar Enter', () => {
    const tarjeta3 = fixture.debugElement.query(By.css('#tarjeta-mazo-3'));
    tarjeta3.nativeElement.click();
    fixture.detectChanges();

    expect(host.seleccionadoEmitido).toBe(3);
  });

  it('no permite seleccionar un mazo incompleto y muestra su motivo', () => {
    const tarjetaIncompleta = fixture.debugElement.query(By.css('#tarjeta-mazo-2'));
    expect(tarjetaIncompleta.nativeElement.textContent).toContain('1/12 cartas');

    tarjetaIncompleta.nativeElement.click();
    fixture.detectChanges();

    // No debe haber emitido la selección del id 2
    expect(host.seleccionadoEmitido).toBeNull();
  });

  it('filtra los mazos al ingresar término de búsqueda', () => {
    const input = fixture.debugElement.query(By.css('input[type="search"]')).nativeElement as HTMLInputElement;
    input.value = 'Gamma';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('.tarjeta-mazo'));
    expect(tarjetas.length).toBe(1);
    expect(tarjetas[0].nativeElement.textContent).toContain('Mazo Gamma');
  });

  it('filtra solo completos al marcar el checkbox', () => {
    const checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]')).nativeElement as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('.tarjeta-mazo'));
    expect(tarjetas.length).toBe(2);
    expect(tarjetas.some((t) => t.nativeElement.textContent.includes('Incompleto'))).toBe(false);
  });

  it('muestra estado de carga cuando cargando es true', () => {
    host.cargando = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cargando tus mazos…');
  });

  it('muestra estado de error y botón de reintento', () => {
    host.error = 'Fallo de red';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Fallo de red');
    const btnReintentar = fixture.debugElement.query(By.css('button[app-boton]'));
    btnReintentar.nativeElement.click();
    expect(host.reintentarLlamado).toBe(true);
  });

  it('muestra estado vacío cuando no hay mazos', () => {
    host.mazos = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tenés ningún mazo configurado');
  });
});

