import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IncidentService } from '../../core/services/incident.service';
import { ToastService } from '../../core/services/toast.service';
import { Incident } from '../../core/models/incident.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { incidentStatusMeta } from '../../shared/utils/status-maps.util';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { ClientRef, PolicyRef } from '../../core/models/common.model';

@Component({
  selector: 'app-incidents-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './incidents-list.component.html'
})
export class IncidentsListComponent implements OnInit {
  private readonly incidentService = inject(IncidentService);
  private readonly toast = inject(ToastService);

  protected readonly incidents = signal<Incident[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly page = signal(1);

  protected readonly incidentStatusMeta = incidentStatusMeta;

  protected readonly pendingDelete = signal<Incident | null>(null);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.incidentService
      .list({ page: this.page(), limit: 10, q: this.search(), status: this.statusFilter() || undefined })
      .subscribe({
        next: (res) => {
          this.incidents.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudieron cargar los siniestros'));
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.load();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  clientName(client: ClientRef | string): string {
    return typeof client === 'string' ? client : client?.name ?? '—';
  }

  policyNumber(policy: PolicyRef | string): string {
    return typeof policy === 'string' ? policy : policy?.policyNumber ?? '—';
  }

  confirmDelete(incident: Incident): void {
    this.pendingDelete.set(incident);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const incident = this.pendingDelete();
    if (!incident) return;

    this.deleting.set(true);
    this.incidentService.remove(incident._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.success('Siniestro eliminado correctamente');
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo eliminar el siniestro'));
        this.pendingDelete.set(null);
      }
    });
  }
}
