import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Body } from './body';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('Body (Carcasa global de la aplicación)', () => {
  let fixture: ComponentFixture<Body>;
  let component: Body;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Body],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'login', component: DummyComponent },
          { path: 'usuario', component: DummyComponent },
          { path: 'usuario/mis-cartas', component: DummyComponent },
          { path: 'usuario/albumes', component: DummyComponent },
          { path: 'usuario/cupones', component: DummyComponent },
          { path: 'usuario/jugar', component: DummyComponent },
          { path: 'usuario/intercambio', component: DummyComponent },
          { path: 'usuario/intercambio/activos', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Body);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('publica data-con-nav="true" en vistas de usuario que llevan nav', async () => {
    await router.navigateByUrl('/usuario/mis-cartas');
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-con-nav')).toBe('true');

    await router.navigateByUrl('/usuario/albumes');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-con-nav')).toBe('true');

    await router.navigateByUrl('/usuario/cupones');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-con-nav')).toBe('true');
  });

  it('publica data-con-nav="false" en rutas sin nav (Jugar e Intercambio)', async () => {
    await router.navigateByUrl('/usuario/jugar');
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-con-nav')).toBe('false');

    await router.navigateByUrl('/usuario/intercambio');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-con-nav')).toBe('false');

    await router.navigateByUrl('/usuario/intercambio/activos');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-con-nav')).toBe('false');
  });

  it('publica data-con-nav="false" en rutas fuera de usuario (login, landing)', async () => {
    await router.navigateByUrl('/login');
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-con-nav')).toBe('false');
  });
});
