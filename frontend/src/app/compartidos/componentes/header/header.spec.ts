import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Header } from './header';
import logoClaro from '../../SVGs/Imagotipo_claro.svg';
import logoOscuro from '../../SVGs/Imagotipo_Alt.svg';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el buscador por defecto y lo oculta en la variante de auth', () => {
    expect(fixture.nativeElement.querySelector('input[type="search"]')).toBeTruthy();

    fixture.componentRef.setInput('enAuth', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[type="search"]')).toBeFalsy();
  });

  it('usa el logo compacto por defecto y el agrandado en la variante de auth', () => {
    const logo = fixture.nativeElement.querySelector('header img');
    expect(logo.classList.contains('h-8')).toBe(true);
    expect(logo.classList.contains('h-12')).toBe(false);

    fixture.componentRef.setInput('enAuth', true);
    fixture.detectChanges();

    expect(logo.classList.contains('h-8')).toBe(false);
    expect(logo.classList.contains('h-12')).toBe(true);
  });

  it('en auth con modo jugador mantiene el fondo sólido y el logo con sus colores', () => {
    fixture.componentRef.setInput('enAuth', true);
    fixture.detectChanges();

    const encabezado = fixture.nativeElement.querySelector('header') as HTMLElement;
    expect(encabezado.classList.contains('bg-header-auth-fondo')).toBe(true);

    const logo = encabezado.querySelector('img') as HTMLImageElement;
    expect(logo.classList.contains('brightness-0')).toBe(false);
    expect(logo.classList.contains('invert')).toBe(false);
  });

  it('en auth con ?modo=empresa usa el fondo marrón de header y el logo en blanco', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ modo: 'empresa' }) },
            queryParamMap: of(convertToParamMap({ modo: 'empresa' })),
          },
        },
      ],
    }).compileComponents();

    const sut = TestBed.createComponent(Header);
    sut.componentRef.setInput('enAuth', true);
    sut.detectChanges();

    const encabezado = sut.nativeElement.querySelector('header') as HTMLElement;
    expect(encabezado.classList.contains('bg-header-auth-fondo')).toBe(true);
    expect(encabezado.classList.contains('bg-transparent')).toBe(false);

    const logo = encabezado.querySelector('img') as HTMLImageElement;
    expect(logo.classList.contains('brightness-0')).toBe(true);
    expect(logo.classList.contains('invert')).toBe(true);

    const componente = sut.componentInstance as unknown as { urlLogo: string };
    expect(componente.urlLogo).toBe(logoClaro);
    expect(componente.urlLogo).not.toBe(logoOscuro);
  });
});
