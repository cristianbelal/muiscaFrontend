import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { provideTestEnvironment } from '../../../testing/test-providers';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideTestEnvironment(),
        { provide: GoogleIdentityService, useValue: { renderButton: () => Promise.resolve(true) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('no envía el formulario vacío y marca los campos obligatorios', () => {
    const component = fixture.componentInstance;
    component.submit();
    fixture.detectChanges();
    expect(component.form.invalid).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('mat-error').length).toBe(2);
  });

  it('ya no ofrece Facebook ni LinkedIn (el backend no los soporta)', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Facebook');
    expect(text).not.toContain('LinkedIn');
  });
});
