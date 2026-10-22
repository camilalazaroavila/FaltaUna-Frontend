import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlTurno } from './control-turno';

describe('ControlTurno', () => {
  let component: ControlTurno;
  let fixture: ComponentFixture<ControlTurno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlTurno]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControlTurno);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('turno', 1);
    fixture.componentRef.setInput('segundosRestantes', 40);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
