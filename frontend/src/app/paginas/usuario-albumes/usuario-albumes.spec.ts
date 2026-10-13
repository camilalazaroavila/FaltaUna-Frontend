import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioAlbumes } from './usuario-albumes';

describe('UsuarioAlbumes', () => {
  let component: UsuarioAlbumes;
  let fixture: ComponentFixture<UsuarioAlbumes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioAlbumes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioAlbumes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
