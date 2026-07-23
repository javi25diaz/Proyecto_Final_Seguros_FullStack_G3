import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { IncidentFormComponent } from './incident-form.component';
import { IncidentService } from '../../core/services/incident.service';
import { PolicyService } from '../../core/services/policy.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiSuccessResponse } from '../../core/models/api-response.model';
import { Incident } from '../../core/models/incident.model';

// `form` is `protected` on the component; tests reach it through this cast instead of
// widening its production visibility just to make it reachable from a spec file.
function formOf(component: IncidentFormComponent) {
  return (component as unknown as { form: IncidentFormComponent['form'] }).form;
}

describe('IncidentFormComponent', () => {
  let component: IncidentFormComponent;
  let incidentServiceSpy: jasmine.SpyObj<IncidentService>;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 6, 15));

    incidentServiceSpy = jasmine.createSpyObj('IncidentService', ['getById', 'create', 'update']);
    const policyServiceStub = { listAll: () => of([]) };
    const toastServiceStub = { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') };
    const activatedRouteStub = { snapshot: { paramMap: convertToParamMap({}) } };

    await TestBed.configureTestingModule({
      imports: [IncidentFormComponent],
      providers: [
        provideRouter([]),
        { provide: IncidentService, useValue: incidentServiceSpy },
        { provide: PolicyService, useValue: policyServiceStub },
        { provide: ToastService, useValue: toastServiceStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(IncidentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('rechaza una fecha futura', () => {
    formOf(component).patchValue({ eventDate: '2026-07-16' });
    expect(formOf(component).controls.eventDate.errors?.['futureDate']).toBeTruthy();
  });

  it('acepta la fecha actual', () => {
    formOf(component).patchValue({ eventDate: '2026-07-15' });
    expect(formOf(component).controls.eventDate.errors).toBeNull();
  });

  it('acepta una fecha pasada', () => {
    formOf(component).patchValue({ eventDate: '2026-07-01' });
    expect(formOf(component).controls.eventDate.errors).toBeNull();
  });

  it('no llama al servicio cuando el formulario es inválido', () => {
    component.submit();

    expect(incidentServiceSpy.create).not.toHaveBeenCalled();
    expect(incidentServiceSpy.update).not.toHaveBeenCalled();
  });

  it('conserva la estructura del payload al registrar un siniestro válido', () => {
    const response: ApiSuccessResponse<Record<string, Incident>> = { success: true, data: { incident: {} as Incident } };
    incidentServiceSpy.create.and.returnValue(of(response));

    formOf(component).patchValue({
      policy: 'policy-1',
      description: 'Choque leve en estacionamiento',
      eventDate: '2026-07-10',
      evidenceUrl: '',
      status: 'reported'
    });

    component.submit();

    expect(incidentServiceSpy.create).toHaveBeenCalledWith({
      description: 'Choque leve en estacionamiento',
      eventDate: '2026-07-10',
      evidenceUrl: undefined,
      status: 'reported',
      policy: 'policy-1'
    });
  });
});
