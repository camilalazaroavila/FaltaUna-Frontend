import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndicadorCategoriasHabilidad } from './indicador-categorias-habilidad';
import type { EfectoCategoriaCarta } from '@modelos/carta.model';

describe('IndicadorCategoriasHabilidad', () => {
  let component: IndicadorCategoriasHabilidad;
  let fixture: ComponentFixture<IndicadorCategoriasHabilidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicadorCategoriasHabilidad],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicadorCategoriasHabilidad);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no muestra nada si no hay efectos sobre categorías', () => {
    fixture.componentRef.setInput('efectos', []);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('hidden')).toBe(true);
    expect(host.querySelector('.indicador-item')).toBeNull();
  });

  it('muestra una categoría que sube con signo + y texto accesible', () => {
    const efectos: EfectoCategoriaCarta[] = [
      { tipo: 'sube', categoria: 'musica', valor: 2 },
    ];
    fixture.componentRef.setInput('efectos', efectos);
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.indicador-item') as HTMLElement;
    expect(item).not.toBeNull();
    expect(item.classList.contains('indicador-item--sube')).toBe(true);
    expect(item.getAttribute('aria-label')).toBe('Mejora Música (+2)');

    const signo = item.querySelector('.indicador-signo') as HTMLElement;
    expect(signo.textContent?.trim()).toBe('+');
    expect(signo.classList.contains('indicador-signo--sube')).toBe(true);
  });

  it('muestra una categoría que baja con signo − y texto accesible', () => {
    const efectos: EfectoCategoriaCarta[] = [
      { tipo: 'baja', categoria: 'tecnologia', valor: -1 },
    ];
    fixture.componentRef.setInput('efectos', efectos);
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.indicador-item') as HTMLElement;
    expect(item).not.toBeNull();
    expect(item.classList.contains('indicador-item--baja')).toBe(true);
    expect(item.getAttribute('aria-label')).toBe('Reduce Tecnología (-1)');

    const signo = item.querySelector('.indicador-signo') as HTMLElement;
    expect(signo.textContent?.trim()).toBe('−');
    expect(signo.classList.contains('indicador-signo--baja')).toBe(true);
  });

  it('muestra efectos mixtos (sube y baja)', () => {
    const efectos: EfectoCategoriaCarta[] = [
      { tipo: 'sube', categoria: 'gastronomia', valor: 3 },
      { tipo: 'baja', categoria: 'indumentaria', valor: -2 },
    ];
    fixture.componentRef.setInput('efectos', efectos);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.indicador-item');
    expect(items.length).toBe(2);
    expect(items[0].classList.contains('indicador-item--sube')).toBe(true);
    expect(items[1].classList.contains('indicador-item--baja')).toBe(true);
  });

  it('limita los íconos visibles con un resumen +N cuando supera maxVisibles', () => {
    const efectos: EfectoCategoriaCarta[] = [
      { tipo: 'sube', categoria: 'gastronomia' },
      { tipo: 'sube', categoria: 'musica' },
      { tipo: 'baja', categoria: 'tecnologia' },
    ];
    fixture.componentRef.setInput('efectos', efectos);
    fixture.componentRef.setInput('maxVisibles', 2);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.indicador-item');
    expect(items.length).toBe(2);

    const resumen = fixture.nativeElement.querySelector('.indicador-resumen') as HTMLElement;
    expect(resumen).not.toBeNull();
    expect(resumen.textContent?.trim()).toBe('+1');
    expect(resumen.getAttribute('aria-label')).toBe('1 categoría más afectada');
  });
});
