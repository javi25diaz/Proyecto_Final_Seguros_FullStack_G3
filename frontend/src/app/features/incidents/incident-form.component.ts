import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IncidentService } from '../../core/services/incident.service';
import { PolicyService } from '../../core/services/policy.service';
import { ToastService } from '../../core/services/toast.service';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { notFutureDateValidator } from '../../shared/validators/not-future-date.validator';
import { Policy } from '../../core/models/policy.model';

@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './incident-form.component.html'
})
export class IncidentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly incidentService = inject(IncidentService);
  private readonly policyService = inject(PolicyService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly incidentId = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly policies = signal<Policy[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    policy: ['', [Validators.required]],
    description: ['', [Validators.required]],
    eventDate: ['', [Validators.required, notFutureDateValidator()]],
    evidenceUrl: [''],
    status: ['reported', [Validators.required]]
  });

  protected readonly maxEventDate = this.getTodayIsoDate();

  private getTodayIsoDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    this.policyService.listAll().subscribe((policies) => this.policies.set(policies));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.incidentId.set(id);
      this.isEditMode.set(true);
      this.loading.set(true);
      this.incidentService.getById(id).subscribe({
        next: (res) => {
          const incident = res.data['incident'];
          this.form.patchValue({
            policy: typeof incident.policy === 'string' ? incident.policy : incident.policy._id,
            description: incident.description,
            eventDate: incident.eventDate.substring(0, 10),
            evidenceUrl: incident.evidenceUrl || '',
            status: incident.status
          });
          this.form.controls.policy.disable();
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudo cargar el siniestro'));
          this.router.navigate(['/incidents']);
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
      description: value.description,
      eventDate: value.eventDate,
      evidenceUrl: value.evidenceUrl || undefined,
      status: value.status
    };
    if (!this.isEditMode()) {
      payload['policy'] = value.policy;
    }

    const request = this.isEditMode()
      ? this.incidentService.update(this.incidentId()!, payload)
      : this.incidentService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Siniestro actualizado correctamente' : 'Siniestro registrado correctamente');
        this.router.navigate(['/incidents']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'No se pudo guardar el siniestro'));
      }
    });
  }
}
