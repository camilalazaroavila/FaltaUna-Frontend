import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingEmpresa } from './landing-empresa';
import { provideRouter } from '@angular/router';

describe('LandingEmpresa', () => {
  let component: LandingEmpresa;
  let fixture: ComponentFixture<LandingEmpresa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingEmpresa],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingEmpresa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
