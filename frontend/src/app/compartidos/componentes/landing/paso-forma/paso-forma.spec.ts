import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasoForma } from './paso-forma';

describe('PasoForma', () => {
  let fixture: ComponentFixture<PasoForma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasoForma],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoForma);
  });

  it('debe crearse y renderizar un SVG con la imagen clipeada', () => {
    fixture.componentRef.setInput('numero', 1);
    fixture.componentRef.setInput('imagenUrl', '/imagenes/landing-usuario/2cartas.png');
    fixture.componentRef.setInput('altTexto', '2 cartas');
    fixture.componentRef.setInput('variante', 'claro');
    fixture.componentRef.setInput('forma', 1);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('.paso-forma-svg');
    expect(svg).toBeTruthy();

    const path = svg.querySelector('.paso-forma-blob');
    expect(path).toBeTruthy();
    expect(path.getAttribute('fill')).toBe('#F9F9B2');
    expect(path.getAttribute('stroke')).toBe('#0D3B40');

    const image = svg.querySelector('image');
    expect(image).toBeTruthy();
    expect(image.getAttribute('href')).toBe('/imagenes/landing-usuario/2cartas.png');

    const num = fixture.nativeElement.querySelector('app-paso-numero');
    expect(num).toBeTruthy();
    expect(num.textContent.trim()).toBe('1');
  });

  it('debe usar colores oscuros con variante oscuro', () => {
    fixture.componentRef.setInput('variante', 'oscuro');
    fixture.componentRef.setInput('forma', 2);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('.paso-forma-svg');
    expect(svg).toBeTruthy();

    const path = svg.querySelector('.paso-forma-blob');
    expect(path.getAttribute('fill')).toBe('#0D3B40');
    expect(path.getAttribute('stroke')).toBe('#072326');
  });

  it('debe cambiar el path SVG según la forma', () => {
    fixture.componentRef.setInput('forma', 1);
    fixture.detectChanges();
    const path1 = fixture.nativeElement.querySelector('.paso-forma-svg path').getAttribute('d');

    fixture.componentRef.setInput('forma', 3);
    fixture.detectChanges();
    const path3 = fixture.nativeElement.querySelector('.paso-forma-svg path').getAttribute('d');

    expect(path1).not.toBe(path3);
  });
});
