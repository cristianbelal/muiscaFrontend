import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtlComponent } from './atl.component';

describe('AtlComponent', () => {
  let component: AtlComponent;
  let fixture: ComponentFixture<AtlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
