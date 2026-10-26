import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { phosphorHeartFill } from '@ng-icons/phosphor-icons/fill';
import { phosphorHeart } from '@ng-icons/phosphor-icons/regular';
import { BotonFavorita } from './boton-favorita';

describe('BotonFavorita', () => {
  let fixture: ComponentFixture<BotonFavorita>;
  let componente: BotonFavorita;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonFavorita],
      providers: [provideIcons({ phosphorHeart, phosphorHeartFill })],
    }).compileComponents();

    fixture = TestBed.createComponent(BotonFavorita);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('nombre', 'La Pulga');
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(componente).toBeTruthy();
  });

  it('muestra el corazón de contorno y la etiqueta de agregar cuando no es favorita', () => {
    const boton = fixture.nativeElement.querySelector<HTMLButtonElement>('button.like-btn');

    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(boton.getAttribute('aria-label')).toBe('Agregar La Pulga a tus cartas deseadas');
    expect(boton.classList.contains('liked')).toBe(false);
  });

  it('refleja el estado favorito con la clase liked y el corazón relleno', () => {
    fixture.componentRef.setInput('favorita', true);
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector<HTMLButtonElement>('button.like-btn');

    expect(boton.getAttribute('aria-pressed')).toBe('true');
    expect(boton.getAttribute('aria-label')).toBe('Quitar La Pulga de tus cartas deseadas');
    expect(boton.classList.contains('liked')).toBe(true);
    expect(boton.querySelector('svg')).not.toBeNull();
  });

  it('emite alternar al presionarlo', () => {
    const alternar = jest.fn();
    componente.alternar.subscribe(alternar);

    fixture.nativeElement.querySelector<HTMLButtonElement>('button.like-btn').click();

    expect(alternar).toHaveBeenCalledTimes(1);
  });

  it('estalla en partículas al pasar a favorita y las retira al terminar', () => {
    jest.useFakeTimers();
    try {
      fixture.componentRef.setInput('favorita', true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.particle').length).toBe(8);
      expect(fixture.nativeElement.querySelector('.like-btn').classList.contains('pop')).toBe(true);

      jest.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.like-btn').classList.contains('pop')).toBe(false);

      jest.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.particle').length).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('no anima al montarse una carta que ya estaba marcada', () => {
    const recienCreado = TestBed.createComponent(BotonFavorita);
    recienCreado.componentRef.setInput('nombre', 'La Pulga');
    recienCreado.componentRef.setInput('favorita', true);
    recienCreado.detectChanges();

    expect(recienCreado.nativeElement.querySelectorAll('.particle').length).toBe(0);
    expect(recienCreado.nativeElement.querySelector('.like-btn').classList.contains('pop')).toBe(false);
  });
});
