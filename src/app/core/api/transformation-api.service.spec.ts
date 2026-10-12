import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiError } from '../http/api-error';
import { errorInterceptor } from '../http/error.interceptor';
import { Execution } from '../models';
import { NotificationService } from '../notifications/notification.service';
import { TransformationApi } from './transformation-api.service';

describe('TransformationApi', () => {
  let api: TransformationApi;
  let http: HttpTestingController;
  let notifications: jasmine.SpyObj<NotificationService>;
  const url = `${environment.apiUrl}/api/transformations/7/executions`;
  const model = new File(['<xmi/>'], 'SCGo.xmi');

  beforeEach(() => {
    notifications = jasmine.createSpyObj('NotificationService', ['error', 'info', 'success']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: NotificationService, useValue: notifications },
      ],
    });
    api = TestBed.inject(TransformationApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía el modelo como multipart con el nombre de parámetro inputModel', () => {
    api.execute(7, model).subscribe();
    const request = http.expectOne(url);
    expect((request.request.body as FormData).get('inputModel')).toEqual(jasmine.any(File));
    request.flush({ id: 1, status: 'SUCCEEDED' });
  });

  it('convierte el 422 del motor en una ejecución FAILED sin mostrar un aviso genérico', fakeAsync(() => {
    const failed = { id: 9, status: 'FAILED', transformationName: 'Go2Java', errorMessage: 'NPE' } as Execution;
    let result: Execution | undefined;
    api.execute(7, model).subscribe((execution) => (result = execution));
    http.expectOne(url).flush(failed, { status: 422, statusText: 'Unprocessable Entity' });
    flush();

    expect(result?.status).toBe('FAILED');
    expect(notifications.error).not.toHaveBeenCalled();
  }));

  it('propaga los problemas cuando el modelo no es conforme al metamodelo (400)', fakeAsync(() => {
    let error: ApiError | undefined;
    api.execute(7, model).subscribe({ error: (e: ApiError) => (error = e) });
    http.expectOne(url).flush(
      { message: 'El modelo no es válido', problems: [{ severity: 'ERROR', line: 2, message: 'x' }] },
      { status: 400, statusText: 'Bad Request' },
    );
    flush();

    expect(error?.problems.length).toBe(1);
    expect(notifications.error).not.toHaveBeenCalled();
  }));

  it('envía published solo cuando se filtra', () => {
    api.list(true).subscribe();
    http.expectOne(`${environment.apiUrl}/api/transformations?published=true`).flush([]);
    api.list().subscribe();
    http.expectOne(`${environment.apiUrl}/api/transformations`).flush([]);
    expect().nothing();
  });
});
