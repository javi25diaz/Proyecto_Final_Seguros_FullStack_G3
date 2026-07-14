import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { Payment } from '../../core/models/payment.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { paymentMethodLabels, paymentStatusMeta } from '../../shared/utils/status-maps.util';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { ClientRef, PolicyRef } from '../../core/models/common.model';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './payments-list.component.html'
})
export class PaymentsListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly toast = inject(ToastService);

  protected readonly payments = signal<Payment[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly page = signal(1);

  protected readonly paymentStatusMeta = paymentStatusMeta;
  protected readonly paymentMethodLabels = paymentMethodLabels;

  protected readonly pendingDelete = signal<Payment | null>(null);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.paymentService
      .list({ page: this.page(), limit: 10, q: this.search(), status: this.statusFilter() || undefined })
      .subscribe({
        next: (res) => {
          this.payments.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudieron cargar los pagos'));
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

  confirmDelete(payment: Payment): void {
    this.pendingDelete.set(payment);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const payment = this.pendingDelete();
    if (!payment) return;

    this.deleting.set(true);
    this.paymentService.remove(payment._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.success('Pago eliminado correctamente');
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo eliminar el pago'));
        this.pendingDelete.set(null);
      }
    });
  }
}
