import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { phosphorTicketFill } from '@ng-icons/phosphor-icons/fill';
import { GsapService } from '@servicios/gsap.service';
import { TicketRecurso } from './ticket-recurso';

describe('TicketRecurso', () => {
  let fixture: ComponentFixture<TicketRecurso>;
  let componente: TicketRecurso;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketRecurso],
      providers: [provideIcons({ phosphorTicketFill }), GsapService],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketRecurso);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('valor', 3);
    fixture.componentRef.setInput('maximo', 6);
    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(componente).toBeTruthy();
  });

  it('debe mostrar el valor actual', () => {
    const numero = fixture.nativeElement.querySelector('.ticket-numero');
    expect(numero?.textContent?.trim()).toBe('3');
  });

  it('debe mostrar la leyenda en variante completa con género correcto', () => {
    const leyenda = fixture.nativeElement.querySelector('.ticket-leyenda');
    expect(leyenda?.textContent?.trim()).toBe('tickets de 6');
  });

  it('debe mostrar "ticket de X" en singular cuando el valor es 1', () => {
    fixture.componentRef.setInput('valor', 1);
    fixture.detectChanges();
    const leyenda = fixture.nativeElement.querySelector('.ticket-leyenda');
    expect(leyenda?.textContent?.trim()).toBe('ticket de 6');
  });

  it('debe ocultar la leyenda y mostrar el icono en variante compacta', () => {
    fixture.componentRef.setInput('variante', 'compacta');
    fixture.detectChanges();

    const leyenda = fixture.nativeElement.querySelector('.ticket-leyenda');
    const icono = fixture.nativeElement.querySelector('ng-icon');

    expect(leyenda).toBeNull();
    expect(icono).not.toBeNull();
  });

  it('debe exponer el estado en el aria-label del host', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.getAttribute('aria-label')).toBe('Tickets disponibles: 3 de 6');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('debe aplicar las clases de token correspondientes', () => {
    const el: HTMLElement = fixture.nativeElement;
    const cuerpo = el.querySelector('.ticket');
    expect(el.classList.contains('text-ticket-texto')).toBe(true);
    expect(el.classList.contains('ticket-contorno')).toBe(true);
    expect(cuerpo?.classList.contains('muesca-ticket')).toBe(true);
    expect(cuerpo?.classList.contains('bg-ticket-fondo')).toBe(true);
  });
});
