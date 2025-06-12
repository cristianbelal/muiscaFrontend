import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtlClientViewComponent } from './atl-client-view.component';

describe('AtlClientViewComponent', () => {
  let component: AtlClientViewComponent;
  let fixture: ComponentFixture<AtlClientViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtlClientViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtlClientViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
