import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TarjetaUsuario } from './tarjeta-usuario';

@Component({
  standalone: true,
  imports: [TarjetaUsuario],
  template: `
    <app-tarjeta-usuario
      [nombreUsuario]="'Maertin'"
      [avatarUrl]="null"
      [destacado]="true"
      [mostrarBadgeLupa]="true"
    >
      <span badge id="test-badge">★ 2 deseadas</span>
      <p info id="test-info">Mensaje de prueba</p>
      <button acciones id="test-accion">Intercambiar</button>
    </app-tarjeta-usuario>
  `,
})
class TestHostComponent {}

describe('TarjetaUsuario', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe crearse y renderizar el nombre de usuario', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Maertin');
  });

  it('debe proyectar el contenido en los slots correspondientes', () => {
    const el = fixture.nativeElement as HTMLElement;
    const badge = el.querySelector('#test-badge');
    const info = el.querySelector('#test-info');
    const accion = el.querySelector('#test-accion');

    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('★ 2 deseadas');
    expect(info).toBeTruthy();
    expect(info?.textContent).toContain('Mensaje de prueba');
    expect(accion).toBeTruthy();
    expect(accion?.textContent).toContain('Intercambiar');
  });

  it('debe mostrar el badge de notificación "!" cuando tieneNotificacion es true', () => {
    const tarjetaFixture = TestBed.createComponent(TarjetaUsuario);
    tarjetaFixture.componentRef.setInput('nombreUsuario', 'Totori');
    tarjetaFixture.componentRef.setInput('tieneNotificacion', true);
    tarjetaFixture.detectChanges();

    const el = tarjetaFixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('!');
  });

  it('debe renderizar la variante compacta correctamente con clase tarjeta-usuario--compacta', () => {
    const tarjetaFixture = TestBed.createComponent(TarjetaUsuario);
    tarjetaFixture.componentRef.setInput('nombreUsuario', 'PillowPilar');
    tarjetaFixture.componentRef.setInput('compacto', true);
    tarjetaFixture.detectChanges();

    const el = tarjetaFixture.nativeElement as HTMLElement;
    expect(el.querySelector('.tarjeta-usuario--compacta')).toBeTruthy();
    expect(el.textContent).toContain('PillowPilar');
  });
});
