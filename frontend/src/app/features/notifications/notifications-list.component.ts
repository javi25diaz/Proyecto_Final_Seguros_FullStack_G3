import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ClientService } from '../../core/services/client.service';
import { UserService } from '../../core/services/user.service';
import { AppNotification } from '../../core/models/notification.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { notificationTypeMeta } from '../../shared/utils/status-maps.util';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { Client } from '../../core/models/client.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PaginationComponent, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './notifications-list.component.html'
})
export class NotificationsListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly clientService = inject(ClientService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly notifications = signal<AppNotification[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly typeFilter = signal('');
  protected readonly readFilter = signal('');
  protected readonly page = signal(1);

  protected readonly notificationTypeMeta = notificationTypeMeta;

  protected readonly pendingDelete = signal<AppNotification | null>(null);
  protected readonly deleting = signal(false);

  protected readonly showCreateForm = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly clients = signal<Client[]>([]);
  protected readonly agents = signal<User[]>([]);

  protected readonly createForm = this.fb.nonNullable.group({
    message: ['', [Validators.required]],
    type: ['system', [Validators.required]],
    recipientUser: [''],
    client: ['']
  });

  get isAdmin(): boolean {
    return this.auth.role() === 'admin';
  }

  ngOnInit(): void {
    this.load();
    if (this.isAdmin) {
      this.clientService.listActiveClients().subscribe((clients) => this.clients.set(clients));
      this.userService.listActiveAgents().subscribe((agents) => this.agents.set(agents));
    }
  }

  load(): void {
    this.loading.set(true);
    this.notificationService
      .list({
        page: this.page(),
        limit: 10,
        q: this.search(),
        type: this.typeFilter() || undefined,
        isRead: this.readFilter() || undefined
      })
      .subscribe({
        next: (res) => {
          this.notifications.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudieron cargar las notificaciones'));
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.load();
  }

  onTypeFilterChange(value: string): void {
    this.typeFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onReadFilterChange(value: string): void {
    this.readFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  markAsRead(notification: AppNotification): void {
    this.notificationService.markAsRead(notification._id).subscribe({
      next: (res) => {
        this.notifications.update((list) => list.map((n) => (n._id === notification._id ? res.data.notification : n)));
        this.toast.success('Notificación marcada como leída');
      },
      error: (err) => this.toast.error(extractErrorMessage(err, 'No se pudo marcar la notificación'))
    });
  }

  confirmDelete(notification: AppNotification): void {
    this.pendingDelete.set(notification);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const notification = this.pendingDelete();
    if (!notification) return;

    this.deleting.set(true);
    this.notificationService.remove(notification._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.success('Notificación eliminada correctamente');
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo eliminar la notificación'));
        this.pendingDelete.set(null);
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }
    const value = this.createForm.getRawValue();
    if (!value.recipientUser && !value.client) {
      this.createError.set('Debe indicar al menos un destinatario (usuario o cliente).');
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    this.notificationService
      .create({
        message: value.message,
        type: value.type as AppNotification['type'],
        recipientUser: value.recipientUser || undefined,
        client: value.client || undefined
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.createForm.reset({ message: '', type: 'system', recipientUser: '', client: '' });
          this.toast.success('Notificación creada correctamente');
          this.load();
        },
        error: (err) => {
          this.creating.set(false);
          this.createError.set(extractErrorMessage(err, 'No se pudo crear la notificación'));
        }
      });
  }
}
