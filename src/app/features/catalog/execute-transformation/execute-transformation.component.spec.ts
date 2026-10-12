import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/notifications/notification.service';
import { provideTestEnvironment } from '../../../testing/test-providers';
import { ExecuteTransformationComponent } from './execute-transformation.component';

describe('ExecuteTransformationComponent', () => {
  let fixture: ComponentFixture<ExecuteTransformationComponent>;
  let http: HttpTestingController;
  let notifications: jasmine.SpyObj<NotificationService>;
  const executionsUrl = `${environment.apiUrl}/api/transformations/3/executions`;
  const running = { id: 20, status: 'RUNNING', stage: 'QUEUED', transformationName: 'Solidity', generatedFiles: [], downloads: {} };

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
    http.expectOne(`${environment.apiUrl}/api/samples`).flush([
      { fileName: 'SContractPatientSol.xmi', metamodel: { id: 3, name: 'EthereumSolidity' }, sizeBytes: 900 },
      { fileName: 'SCGo.xmi', metamodel: { id: 1, name: 'HyperledgerGo' }, sizeBytes: 900 },
    ]);
    fixture.detectChanges();
  });

  function startWithFile(): void {
    fixture.componentInstance.inputModel.setValue(new File(['<xmi/>'], 'c.xmi'));
    fixture.componentInstance.run();
    const request = http.expectOne(executionsUrl);
    expect((request.request.body as FormData).get('async')).toBe('true');
    request.flush(running, { status: 202, statusText: 'Accepted' });
  }

  it('indica qué metamodelo debe cumplir el modelo', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('EthereumSolidity');
  });

  it('no ejecuta sin un modelo seleccionado', () => {
    fixture.componentInstance.run();
    http.expectNone(executionsUrl);
    expect(fixture.componentInstance.inputModel.touched).toBeTrue();
  });

  it('solo ofrece los modelos guardados y los ejemplos compatibles', () => {
    expect(fixture.componentInstance.compatibleModels().map((m) => m.id)).toEqual([8]);
    expect(fixture.componentInstance.compatibleSamples().map((s) => s.fileName)).toEqual(['SContractPatientSol.xmi']);
  });

  it('sigue el avance en segundo plano y avisa cuando termina bien', fakeAsync(() => {
    startWithFile();
    tick(0);
    http.expectOne(`${environment.apiUrl}/api/executions/20`).flush({ ...running, stage: 'ACCELEO' });
    expect(fixture.componentInstance.progress()?.stage).toBe('ACCELEO');

    tick(1500);
    http.expectOne(`${environment.apiUrl}/api/executions/20`).flush({
      ...running,
      status: 'SUCCEEDED',
      stage: null,
      generatedFiles: ['Patient.sol'],
      durationMs: 1200,
    });
    flush();
    discardPeriodicTasks();
    expect(notifications.success).toHaveBeenCalledWith(jasmine.stringContaining('Transformación exitosa'));
    expect(fixture.componentInstance.execution()?.status).toBe('SUCCEEDED');
    expect(fixture.componentInstance.running()).toBeFalse();
  }));

  it('avisa con una notificación de error cuando el motor falla', fakeAsync(() => {
    startWithFile();
    tick(0);
    http.expectOne(`${environment.apiUrl}/api/executions/20`).flush({ ...running, status: 'FAILED', stage: null });
    flush();
    discardPeriodicTasks();
    expect(notifications.error).toHaveBeenCalledWith(jasmine.stringContaining('falló'));
  }));

  it('muestra el error de validación sin iniciar la ejecución (400)', fakeAsync(() => {
    fixture.componentInstance.inputModel.setValue(new File(['<xmi/>'], 'c.xmi'));
    fixture.componentInstance.run();
    http.expectOne(executionsUrl).flush(
      { message: 'El modelo no pertenece a EthereumSolidity' },
      { status: 400, statusText: 'Bad Request' },
    );
    flush();
    expect(fixture.componentInstance.error()?.message).toContain('EthereumSolidity');
    expect(fixture.componentInstance.running()).toBeFalse();
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

  it('carga un modelo de ejemplo como archivo de entrada', () => {
    const component = fixture.componentInstance;
    component.useSample(component.compatibleSamples()[0]);
    http
      .expectOne(`${environment.apiUrl}/api/samples/SContractPatientSol.xmi`)
      .flush(new Blob(['<xmi/>']), { headers: { 'Content-Disposition': 'attachment; filename="SContractPatientSol.xmi"' } });
    expect(component.inputModel.value?.name).toBe('SContractPatientSol.xmi');
  });
});
