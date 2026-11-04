import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Landing } from './landing';

/**
 * Verificación de arranque de la landing pública.
 */
describe('Landing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the page', () => {
    const fixture = TestBed.createComponent(Landing);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debe incluir las imágenes decorativas de Jaime y Falti y la clase de ancho en FAQ', () => {
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const jaime = compiled.querySelector('img[src="/imagenes/landing-usuario/jaimeqa.png"]');
    const falti = compiled.querySelector('img[src="/imagenes/landing-usuario/faltiqa.png"]');
    const listaFaq = compiled.querySelector('.faq-lista-acordeon');

    expect(jaime).toBeTruthy();
    expect(jaime?.classList.contains('hidden')).toBe(true);
    expect(jaime?.classList.contains('md:block')).toBe(true);

    expect(falti).toBeTruthy();
    expect(falti?.classList.contains('hidden')).toBe(true);
    expect(falti?.classList.contains('md:block')).toBe(true);

    expect(listaFaq).toBeTruthy();
  });
});
