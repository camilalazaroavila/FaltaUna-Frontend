import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelDesplazable } from './panel-desplazable';

@Component({
  standalone: true,
  imports: [PanelDesplazable],
  template: `
    <app-panel-desplazable clasesExtra="max-h-96">
      <div id="contenido-prueba">Elemento con scroll</div>
    </app-panel-desplazable>
  `,
})
class TestHostComponent {}

describe('PanelDesplazable Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe proyectar el contenido correctamente', () => {
    const el = fixture.nativeElement.querySelector('#contenido-prueba');
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('Elemento con scroll');
  });

  it('debe aplicar las clases extra en el contenedor desplazable', () => {
    const panel = fixture.nativeElement.querySelector('.panel-desplazable');
    expect(panel.classList.contains('max-h-96')).toBe(true);
  });
});
