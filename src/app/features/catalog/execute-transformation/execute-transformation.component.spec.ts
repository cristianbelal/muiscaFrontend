import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { provideTestEnvironment } from '../../../testing/test-providers';
import { ExecuteTransformationComponent } from './execute-transformation.component';

describe('ExecuteTransformationComponent', () => {
  let fixture: ComponentFixture<ExecuteTransformationComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecuteTransformationComponent],
      providers: [provideTestEnvironment()],
    }).compileComponents();
    fixture = TestBed.createComponent(ExecuteTransformationComponent);
    fixture.componentRef.setInput('id', '3');
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/api/transformations/3`).flush({
      id: 3,
      name: 'Generar código Solidity (Ethereum)',
      description: 'Sube un modelo EthereumSolidity',
      inputMetamodel: { id: 3, name: 'EthereumSolidity' },
      outputMetamodel: null,
      atlModule: null,
      acceleoModule: { id: 4, name: 'Generador de código Solidity' },
      producesModel: false,
      producesCode: true,
      published: true,
      createdBy: 'admin',
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
    });
    fixture.detectChanges();
  });

  it('indica qué metamodelo debe cumplir el modelo', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('EthereumSolidity');
  });

  it('no ejecuta sin un modelo seleccionado', () => {
    fixture.componentInstance.run();
    http.expectNone(`${environment.apiUrl}/api/transformations/3/executions`);
    expect(fixture.componentInstance.inputModel.touched).toBeTrue();
  });
});
