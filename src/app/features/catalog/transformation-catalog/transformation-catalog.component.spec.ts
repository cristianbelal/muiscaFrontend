import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Transformation } from '../../../core/models';
import { provideTestEnvironment } from '../../../testing/test-providers';
import { TransformationCatalogComponent } from './transformation-catalog.component';

const transformation = (id: number, name: string, producesCode: boolean): Transformation => ({
  id,
  name,
  description: null,
  inputMetamodel: { id: 1, name: 'HyperledgerGo' },
  outputMetamodel: producesCode ? null : { id: 2, name: 'HyperledgerJava' },
  atlModule: producesCode ? null : { id: 1, name: 'Go2Java' },
  acceleoModule: producesCode ? { id: 1, name: 'Generador Go' } : null,
  producesModel: !producesCode,
  producesCode,
  published: true,
  createdBy: 'admin',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
});

describe('TransformationCatalogComponent', () => {
  let fixture: ComponentFixture<TransformationCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransformationCatalogComponent],
      providers: [provideTestEnvironment()],
    }).compileComponents();
    fixture = TestBed.createComponent(TransformationCatalogComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/api/transformations`)
      .flush([transformation(1, 'Contrato Go → Java', false), transformation(2, 'Generar código Go', true)]);
    fixture.detectChanges();
  });

  it('muestra una tarjeta por transformación del catálogo', () => {
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('mat-card-title').length).toBe(2);
  });

  it('filtra por resultado y busca sin distinguir tildes', () => {
    const component = fixture.componentInstance;
    component.output.set('code');
    expect(component.filtered().map((t) => t.id)).toEqual([2]);
    component.output.set('all');
    component.search.set('codigo');
    expect(component.filtered().map((t) => t.id)).toEqual([2]);
  });
});
