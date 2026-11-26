import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TONO_EMPRESA, type TonoAlbum } from '@modelos/empresa.mock';
import { TarjetaKpi } from './tarjeta-kpi';

@Component({
  standalone: true,
  imports: [TarjetaKpi],
  template: `
    <app-tarjeta-kpi
      [etiqueta]="etiqueta"
      [valor]="valor"
      [detalle]="detalle"
      [icono]="icono"
      [tono]="tono"
    />
  `,
})
class HostComponent {
  etiqueta = 'Completaron';
  valor = '45%';
  detalle: string | undefined = '180 jugadores';
  icono: string | undefined = 'phosphorTrophyFill';
  tono: TonoAlbum = 'violeta';
}

describe('TarjetaKpi', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza etiqueta, valor y detalle opcional', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Completaron');
    expect(texto).toContain('45%');
    expect(texto).toContain('180 jugadores');
  });

  it('oculta el detalle y el ícono cuando no se proveen', () => {
    host.detalle = undefined;
    host.icono = undefined;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('180 jugadores');
    expect(fixture.nativeElement.querySelector('ng-icon')).toBeNull();
  });

  it('aplica los colores correspondientes al tono seleccionado', () => {
    host.tono = 'azul';
    fixture.detectChanges();

    const tarjeta = fixture.debugElement.children[0].componentInstance as TarjetaKpi;
    expect(tarjeta['acento']()).toEqual(TONO_EMPRESA.azul);
  });
});
