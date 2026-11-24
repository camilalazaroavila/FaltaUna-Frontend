import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EmpresaAlbumCartas } from './empresa-album-cartas';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { PLANES } from '@modelos/plan.model';

describe('EmpresaAlbumCartas (Given-When-Then)', () => {
  let router: Router;
  let borrador: AlbumBorrador;
  let suscripcionEstado: SuscripcionEstado;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpresaAlbumCartas],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    borrador = TestBed.inject(AlbumBorrador);
    suscripcionEstado = TestBed.inject(SuscripcionEstado);
    suscripcionEstado.planElegido.set(PLANES[0]); // Plan Básico (12 cartas)

    // Datos válidos del paso anterior
    borrador.nombreMarca.set('Havanna');
    borrador.descripcion.set('Alfajores y café');
    borrador.usuarioRedSocial.set('@havanna');
    borrador.emailContacto.set('contacto@havanna.com');
    borrador.categoria.set('1');
    borrador.logo.set(new File(['dummy'], 'logo.png', { type: 'image/png' }));
    borrador.fotoLocal.set(new File(['dummy'], 'local.png', { type: 'image/png' }));
  });

  it('Dado el componente Paso 3 con menos de 2 cartas cargadas, Cuando se presiona Siguiente Paso, Entonces no navega a la vista previa', () => {
    // Given
    borrador.imagenes.set(Array(12).fill(null));
    const fixture = TestBed.createComponent(EmpresaAlbumCartas);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // When
    (component as unknown as { siguiente: () => void }).siguiente();

    // Then
    expect(router.navigate).not.toHaveBeenCalledWith(['/empresa/album/crear/vista-previa']);
  });

  it('Dado el componente Paso 3 con al menos 2 cartas cargadas, Cuando se presiona Siguiente Paso, Entonces navega con éxito a la vista previa (Paso 4)', () => {
    // Given
    const cartas = Array(12).fill(null);
    cartas[0] = new File(['dummy1'], 'carta1.png', { type: 'image/png' });
    cartas[1] = new File(['dummy2'], 'carta2.png', { type: 'image/png' });
    borrador.imagenes.set(cartas);

    const fixture = TestBed.createComponent(EmpresaAlbumCartas);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // When
    (component as unknown as { siguiente: () => void }).siguiente();

    // Then
    expect(router.navigate).toHaveBeenCalledWith(['/empresa/album/crear/vista-previa']);
  });

  it('Dado el componente Paso 3, Cuando se renderiza, Entonces muestra la consigna actualizada y cada casilla tiene app-carta e input con maxlength 15', () => {
    // Given
    const fixture = TestBed.createComponent(EmpresaAlbumCartas);

    // When
    fixture.detectChanges();

    // Then
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Subí las imágenes y dale nombre a las cartas que van a formar parte de tu álbum');

    const cartas = el.querySelectorAll('app-carta');
    expect(cartas.length).toBe(12);

    const inputs = el.querySelectorAll<HTMLInputElement>('input[placeholder="Nombre carta"]');
    expect(inputs.length).toBe(12);
    expect(inputs[0].maxLength).toBe(15);

    // Simular escritura de nombre
    inputs[0].value = 'Carta Especial';
    inputs[0].dispatchEvent(new Event('input'));
    expect(borrador.nombreCartaDe(0)).toBe('Carta Especial');
  });
});
