import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { provideTestEnvironment } from '../../../testing/test-providers';
import { AtlWorkspaceComponent } from './atl-workspace.component';

describe('AtlWorkspaceComponent', () => {
  let fixture: ComponentFixture<AtlWorkspaceComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtlWorkspaceComponent],
      providers: [provideTestEnvironment()],
    }).compileComponents();
    fixture = TestBed.createComponent(AtlWorkspaceComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('compila con solo el archivo .atl', () => {
    const component = fixture.componentInstance;
    component.form.controls.atlFile.setValue(new File(['module Go2Java;'], 'Go2Java.atl'));
    component.compile();
    const request = http.expectOne(`${environment.apiUrl}/api/workspace/atl/compile`);
    request.flush({ valid: true, compiler: 'EMFTVM', moduleName: 'Go2Java', problems: [] });
    expect(component.compilation()?.valid).toBeTrue();
  });

  it('exige los cuatro archivos para ejecutar', () => {
    fixture.componentInstance.run();
    http.expectNone(`${environment.apiUrl}/api/workspace/atl/run`);
    expect(fixture.componentInstance.form.invalid).toBeTrue();
  });
});
