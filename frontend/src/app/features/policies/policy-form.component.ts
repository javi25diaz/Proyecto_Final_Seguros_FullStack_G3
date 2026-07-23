import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PolicyService } from '../../core/services/policy.service';
import { ClientService } from '../../core/services/client.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { dateRangeValidator } from '../../shared/validators/date-range.validator';
import { Client } from '../../core/models/client.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-policy-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './policy-form.component.html'
})
export class PolicyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly policyService = inject(PolicyService);
  private readonly clientService = inject(ClientService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly policyId = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly clients = signal<Client[]>([]);
  protected readonly agents = signal<User[]>([]);

  protected readonly form = this.fb.nonNullable.group(
    {
      client: ['', [Validators.required]],
      insuranceType: ['auto', [Validators.required]],
      coverage: ['', [Validators.required]],
      premium: [0, [Validators.required, Validators.min(0.01)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      status: ['draft', [Validators.required]],
      assignedAgent: [''],
      notes: ['']
    },
    { validators: dateRangeValidator('startDate', 'endDate') }
  );

  get isAdmin(): boolean {
    return this.auth.role() === 'admin';
  }

  ngOnInit(): void {
    this.clientService.listActiveClients().subscribe((clients) => this.clients.set(clients));

    if (this.isAdmin) {
      this.form.controls.assignedAgent.addValidators(Validators.required);
      this.userService.listActiveAgents().subscribe((agents) => this.agents.set(agents));
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.policyId.set(id);
      this.isEditMode.set(true);
      this.loading.set(true);
      this.policyService.getById(id).subscribe({
        next: (res) => {
          const policy = res.data['policy'];
          this.form.patchValue({
            client: typeof policy.client === 'string' ? policy.client : policy.client._id,
            insuranceType: policy.insuranceType,
            coverage: policy.coverage,
            premium: policy.premium,
            startDate: policy.startDate.substring(0, 10),
            endDate: policy.endDate.substring(0, 10),
            status: policy.status,
            assignedAgent: typeof policy.assignedAgent === 'string' ? policy.assignedAgent : policy.assignedAgent._id,
            notes: policy.notes || ''
          });
          this.form.controls.client.disable();
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudo cargar la póliza'));
          this.router.navigate(['/policies']);
        }
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      insuranceType: value.insuranceType,
      coverage: value.coverage,
      premium: value.premium,
      startDate: value.startDate,
      endDate: value.endDate,
      status: value.status,
      notes: value.notes || undefined
    };
    if (!this.isEditMode()) {
      payload['client'] = value.client;
    }
    if (value.assignedAgent) {
      payload['assignedAgent'] = value.assignedAgent;
    }

    const request = this.isEditMode()
      ? this.policyService.update(this.policyId()!, payload)
      : this.policyService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Póliza actualizada correctamente' : 'Póliza creada correctamente');
        this.router.navigate(['/policies']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'No se pudo guardar la póliza'));
      }
    });
  }
}
