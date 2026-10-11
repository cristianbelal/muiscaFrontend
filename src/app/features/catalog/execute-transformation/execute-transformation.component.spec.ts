import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/notifications/notification.service';
import { provideTestEnvironment } from '../../../testing/test-providers';
import { ExecuteTransformationComponent } from './execute-transformation.component';

describe('ExecuteTransformationComponent', () => {
  let fixture: ComponentFixture<ExecuteTransformationComponent>;
  let http: HttpTestingController;
  let notifications: jasmine.SpyObj<NotificationService>;
  const executionsUrl = `${environment.apiUrl}/api/transformations/3/executions`;

  beforeEach(async () => {
    notifications = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    await TestBed.configureTestingModule({
      imports: [ExecuteTransformationComponent],
      providers: [provideTestEnvironment(), { provide: NotificationService, useValue: notifications }],
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
    http.expectOne(`${environment.apiUrl}/api/models`).flush([
      { id: 8, name: 'Mi contrato', metamodel: { id: 3, name: 'EthereumSolidity' }, fileName: 'c.xmi' },
      { id: 9, name: 'Otro', metamodel: { id: 1, name: 'HyperledgerGo' }, fileName: 'g.xmi' },
    ]);
    fixture.detectChanges();
  });

  it('indica qué metamodelo debe cumplir el modelo', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('EthereumSolidity');
  });

  it('no ejecuta sin un modelo seleccionado', () => {
    fixture.componentInstance.run();
    http.expectNone(executionsUrl);
    expect(fixture.componentInstance.inputModel.touched).toBeTrue();
  });

  it('solo ofrece los modelos guardados compatibles con la transformación', () => {
    expect(fixture.componentInstance.compatibleModels().map((m) => m.id)).toEqual([8]);
  });

  it('avisa con una notificación cuando la transformación termina bien', fakeAsync(() => {
    const component = fixture.componentInstance;
    component.inputModel.setValue(new File(['<xmi/>'], 'c.xmi'));
    component.run();
    http.expectOne(executionsUrl).flush({
      id: 20,
      status: 'SUCCEEDED',
      transformationName: 'Generar código Solidity (Ethereum)',
      outputModelName: null,
      generatedFiles: ['Patient.sol'],
      durationMs: 1200,
      downloads: {},
    });
    flush();
    expect(notifications.success).toHaveBeenCalledWith(jasmine.stringContaining('Transformación exitosa'));
    expect(component.execution()?.id).toBe(20);
  }));

  it('avisa con una notificación de error cuando el motor falla (422)', fakeAsync(() => {
    const component = fixture.componentInstance;
    component.inputModel.setValue(new File(['<xmi/>'], 'c.xmi'));
    component.run();
    http.expectOne(executionsUrl).flush(
      { id: 21, status: 'FAILED', transformationName: 'x', errorMessage: 'NPE', generatedFiles: [], downloads: {} },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    flush();
    expect(notifications.error).toHaveBeenCalledWith(jasmine.stringContaining('falló'));
  }));

  it('ejecuta con un modelo de la biblioteca enviando modelId', () => {
    const component = fixture.componentInstance;
    component.setSource('library');
    component.storedModelId.setValue(8);
    component.run();
    const request = http.expectOne(executionsUrl);
    expect((request.request.body as FormData).get('modelId')).toBe('8');
    expect((request.request.body as FormData).has('inputModel')).toBeFalse();
  });
});
