import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PolicyService } from '../../core/services/policy.service';
import { ToastService } from '../../core/services/toast.service';
import { Policy } from '../../core/models/policy.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { insuranceTypeMeta, policyStatusMeta } from '../../shared/utils/status-maps.util';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { ClientRef } from '../../core/models/common.model';

@Component({
  selector: 'app-policies-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './policies-list.component.html'
})
export class PoliciesListComponent implements OnInit {
  private readonly policyService = inject(PolicyService);
  private readonly toast = inject(ToastService);

  protected readonly policies = signal<Policy[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly typeFilter = signal('');
  protected readonly page = signal(1);

  protected readonly policyStatusMeta = policyStatusMeta;
  protected readonly insuranceTypeMeta = insuranceTypeMeta;

  protected readonly pendingDelete = signal<Policy | null>(null);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.policyService
      .list({
        page: this.page(),
        limit: 10,
        q: this.search(),
        status: this.statusFilter() || undefined,
        insuranceType: this.typeFilter() || undefined
      })
      .subscribe({
        next: (res) => {
          this.policies.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudieron cargar las pólizas'));
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

  onTypeFilterChange(value: string): void {
    this.typeFilter.set(value);
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

  confirmDelete(policy: Policy): void {
    this.pendingDelete.set(policy);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const policy = this.pendingDelete();
    if (!policy) return;

    this.deleting.set(true);
    this.policyService.remove(policy._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.success('Póliza eliminada correctamente');
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo eliminar la póliza'));
        this.pendingDelete.set(null);
      }
    });
  }
}
