import { TestBed } from '@angular/core/testing';
import { Body } from './body';

describe('Body', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Body],
    }).compileComponents();
  });

  it('should create the shell', () => {
    const fixture = TestBed.createComponent(Body);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
