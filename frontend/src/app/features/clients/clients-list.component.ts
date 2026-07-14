import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Client } from '../../core/models/client.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { clientStatusMeta } from '../../shared/utils/status-maps.util';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { UserRef } from '../../core/models/common.model';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './clients-list.component.html'
})
export class ClientsListComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly clients = signal<Client[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly page = signal(1);
  protected readonly clientStatusMeta = clientStatusMeta;

  protected readonly pendingDelete = signal<Client | null>(null);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.clientService
      .list({ page: this.page(), limit: 10, q: this.search(), status: this.statusFilter() || undefined })
      .subscribe({
        next: (res) => {
          this.clients.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudieron cargar los clientes'));
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

  agentName(agent: UserRef | string): string {
    return typeof agent === 'string' ? agent : agent?.name ?? '—';
  }

  confirmDelete(client: Client): void {
    this.pendingDelete.set(client);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const client = this.pendingDelete();
    if (!client) return;

    this.deleting.set(true);
    this.clientService.remove(client._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.success('Cliente eliminado correctamente');
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo eliminar el cliente'));
        this.pendingDelete.set(null);
      }
    });
  }
}
