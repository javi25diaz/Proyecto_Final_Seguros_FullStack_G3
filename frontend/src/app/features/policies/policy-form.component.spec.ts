import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PolicyFormComponent } from './policy-form.component';
import { PolicyService } from '../../core/services/policy.service';
import { ClientService } from '../../core/services/client.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiSuccessResponse } from '../../core/models/api-response.model';
import { Policy } from '../../core/models/policy.model';

// `form` is `protected` on the component; tests reach it through this cast instead of
// widening its production visibility just to make it reachable from a spec file.
function formOf(component: PolicyFormComponent) {
  return (component as unknown as { form: PolicyFormComponent['form'] }).form;
}

describe('PolicyFormComponent', () => {
  let component: PolicyFormComponent;
  let policyServiceSpy: jasmine.SpyObj<PolicyService>;

  beforeEach(async () => {
    policyServiceSpy = jasmine.createSpyObj('PolicyService', ['getById', 'create', 'update']);
    const clientServiceStub = { listActiveClients: () => of([]) };
    const userServiceStub = { listActiveAgents: () => of([]) };
    const authServiceStub = { role: () => 'user' as const };
    const toastServiceStub = { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') };
    const activatedRouteStub = { snapshot: { paramMap: convertToParamMap({}) } };

    await TestBed.configureTestingModule({
      imports: [PolicyFormComponent],
      providers: [
        provideRouter([]),
        { provide: PolicyService, useValue: policyServiceSpy },
        { provide: ClientService, useValue: clientServiceStub },
        { provide: UserService, useValue: userServiceStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: ToastService, useValue: toastServiceStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PolicyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('marca el formulario como inválido cuando la fecha final es anterior a la inicial', () => {
    formOf(component).patchValue({ startDate: '2026-08-10', endDate: '2026-08-01' });
    expect(formOf(component).errors?.['dateRange']).toBeTruthy();
  });

  it('marca el formulario como inválido cuando las fechas son iguales', () => {
    formOf(component).patchValue({ startDate: '2026-08-05', endDate: '2026-08-05' });
    expect(formOf(component).errors?.['dateRange']).toBeTruthy();
  });

  it('no genera error dateRange cuando el rango es válido', () => {
    formOf(component).patchValue({ startDate: '2026-08-01', endDate: '2026-08-10' });
    expect(formOf(component).errors?.['dateRange']).toBeFalsy();
  });

  it('no llama al servicio cuando el formulario es inválido', () => {
    component.submit();

    expect(policyServiceSpy.create).not.toHaveBeenCalled();
    expect(policyServiceSpy.update).not.toHaveBeenCalled();
  });

  it('marca los controles como touched tras un intento de envío inválido', () => {
    expect(formOf(component).controls.startDate.touched).toBeFalse();

    component.submit();

    expect(formOf(component).controls.startDate.touched).toBeTrue();
    expect(formOf(component).controls.endDate.touched).toBeTrue();
  });

  it('conserva la estructura del payload al crear una póliza válida', () => {
    const response: ApiSuccessResponse<Record<string, Policy>> = { success: true, data: { policy: {} as Policy } };
    policyServiceSpy.create.and.returnValue(of(response));

    formOf(component).patchValue({
      client: 'client-1',
      insuranceType: 'auto',
      coverage: 'Cobertura total',
      premium: 150,
      startDate: '2026-08-01',
      endDate: '2026-08-10',
      status: 'draft',
      assignedAgent: '',
      notes: ''
    });

    component.submit();

    expect(policyServiceSpy.create).toHaveBeenCalledWith({
      insuranceType: 'auto',
      coverage: 'Cobertura total',
      premium: 150,
      startDate: '2026-08-01',
      endDate: '2026-08-10',
      status: 'draft',
      notes: undefined,
      client: 'client-1'
    });
  });
});
