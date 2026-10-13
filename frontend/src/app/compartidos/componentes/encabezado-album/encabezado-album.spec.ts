import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncabezadoAlbum } from './encabezado-album';

describe('EncabezadoAlbum', () => {
  let component: EncabezadoAlbum;
  let fixture: ComponentFixture<EncabezadoAlbum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncabezadoAlbum]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncabezadoAlbum);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
