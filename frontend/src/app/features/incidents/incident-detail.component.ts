import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IncidentService } from '../../core/services/incident.service';
import { ToastService } from '../../core/services/toast.service';
import { Incident, IncidentStatus } from '../../core/models/incident.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { incidentStatusMeta } from '../../shared/utils/status-maps.util';
import { ClientRef, PolicyRef } from '../../core/models/common.model';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './incident-detail.component.html'
})
export class IncidentDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly incidentService = inject(IncidentService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly incident = signal<Incident | null>(null);
  protected readonly loading = signal(false);
  protected readonly changingStatus = signal(false);
  protected readonly statusErrorMessage = signal<string | null>(null);
  protected readonly incidentStatusMeta = incidentStatusMeta;

  protected readonly statusForm = this.fb.nonNullable.group({
    status: ['reported' as IncidentStatus, [Validators.required]]
  });

  ngOnInit(): void {
    this.loadIncident();
  }

  private loadIncident(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.incidentService.getById(id).subscribe({
      next: (res) => {
        const incident = res.data['incident'];
        this.incident.set(incident);
        this.statusForm.patchValue({ status: incident.status });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar el siniestro'));
      }
    });
  }

  submitStatusChange(): void {
    const incident = this.incident();
    if (!incident || this.statusForm.invalid || this.changingStatus()) {
      this.statusForm.markAllAsTouched();
      return;
    }

    this.changingStatus.set(true);
    this.statusErrorMessage.set(null);

    const payload = this.statusForm.getRawValue();
    this.incidentService.changeStatus(incident._id, payload).subscribe({
      next: (res) => {
        this.incident.set(res.data.incident);
        this.changingStatus.set(false);
        this.toast.success('Estado del siniestro actualizado correctamente');
      },
      error: (err) => {
        this.changingStatus.set(false);
        this.statusErrorMessage.set(extractErrorMessage(err, 'No se pudo actualizar el estado'));
      }
    });
  }

  clientRef(client: ClientRef | string): ClientRef | null {
    return typeof client === 'string' ? null : client;
  }

  policyRef(policy: PolicyRef | string): PolicyRef | null {
    return typeof policy === 'string' ? null : policy;
  }
}
