import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Jaime } from './jaime';

describe('JaimeComponent', () => {
  let fixture: ComponentFixture<Jaime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Jaime],
    }).compileComponents();

    fixture = TestBed.createComponent(Jaime);
  });

  it('elige la imagen según la pose', () => {
    fixture.componentRef.setInput('pose', 'senalando');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.src).toContain('gatito%20se%C3%B1alando.jpg');

    fixture.componentRef.setInput('pose', 'si');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')?.src).toContain('jaime%20diciendo%20si.png');

    fixture.componentRef.setInput('pose', 'no');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')?.src).toContain('jaime%20diciendo%20no.png');
  });

  it('voltea solo la pose señalando cuando la mirada es izquierda', () => {
    fixture.componentRef.setInput('pose', 'senalando');
    fixture.componentRef.setInput('mirada', 'izquierda');
    fixture.detectChanges();

    const giro = fixture.nativeElement.querySelector('.jaime__giro') as HTMLElement;
    expect(giro.classList.contains('jaime__giro--volteado')).toBe(true);

    fixture.componentRef.setInput('mirada', 'derecha');
    fixture.detectChanges();
    expect(giro.classList.contains('jaime__giro--volteado')).toBe(false);

    // En pose 'si' o 'no' nunca se voltea aunque mire a la izquierda
    fixture.componentRef.setInput('pose', 'si');
    fixture.componentRef.setInput('mirada', 'izquierda');
    fixture.detectChanges();
    expect(giro.classList.contains('jaime__giro--volteado')).toBe(false);
  });

  it('aplica las clases de tamaño sm y lg', () => {
    fixture.componentRef.setInput('tamanio', 'sm');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('h-20')).toBe(true);

    fixture.componentRef.setInput('tamanio', 'lg');
    fixture.detectChanges();
    expect(fixture.nativeElement.className).toContain('clamp');
  });
});

