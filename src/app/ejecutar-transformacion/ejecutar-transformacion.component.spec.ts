import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EjecutarTransformacionComponent } from './ejecutar-transformacion.component';

describe('EjecutarTransformacionComponent', () => {
  let component: EjecutarTransformacionComponent;
  let fixture: ComponentFixture<EjecutarTransformacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EjecutarTransformacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EjecutarTransformacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
