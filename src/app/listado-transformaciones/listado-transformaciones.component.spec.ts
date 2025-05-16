import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoTransformacionesComponent } from './listado-transformaciones.component';

describe('ListadoTransformacionesComponent', () => {
  let component: ListadoTransformacionesComponent;
  let fixture: ComponentFixture<ListadoTransformacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoTransformacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoTransformacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
