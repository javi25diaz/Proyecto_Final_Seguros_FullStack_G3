import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IncidentService } from '../../core/services/incident.service';
import { ToastService } from '../../core/services/toast.service';
import { Incident } from '../../core/models/incident.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { incidentStatusMeta } from '../../shared/utils/status-maps.util';
import { ClientRef, PolicyRef } from '../../core/models/common.model';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './incident-detail.component.html'
})
export class IncidentDetailComponent implements OnInit {
  private readonly incidentService = inject(IncidentService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly incident = signal<Incident | null>(null);
  protected readonly loading = signal(false);
  protected readonly incidentStatusMeta = incidentStatusMeta;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.incidentService.getById(id).subscribe({
      next: (res) => {
        this.incident.set(res.data['incident']);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar el siniestro'));
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
