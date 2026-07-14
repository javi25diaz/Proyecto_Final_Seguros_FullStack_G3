import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { AppNotification } from '../../core/models/notification.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { notificationTypeMeta } from '../../shared/utils/status-maps.util';
import { ClientRef, UserRef } from '../../core/models/common.model';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './notification-detail.component.html'
})
export class NotificationDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly notification = signal<AppNotification | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly notificationTypeMeta = notificationTypeMeta;

  protected readonly editForm = this.fb.nonNullable.group({
    message: ['', [Validators.required]],
    isRead: [false]
  });

  get isAdmin(): boolean {
    return this.auth.role() === 'admin';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.notificationService.getById(id).subscribe({
      next: (res) => {
        const notification = res.data['notification'];
        this.notification.set(notification);
        this.editForm.patchValue({ message: notification.message, isRead: notification.isRead });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar la notificación'));
      }
    });
  }

  clientRef(client?: ClientRef | string): ClientRef | null {
    return client && typeof client !== 'string' ? client : null;
  }

  recipientRef(recipient?: UserRef | string): UserRef | null {
    return recipient && typeof recipient !== 'string' ? recipient : null;
  }

  markAsRead(): void {
    const notification = this.notification();
    if (!notification) return;
    this.notificationService.markAsRead(notification._id).subscribe({
      next: (res) => {
        this.notification.set(res.data.notification);
        this.toast.success('Notificación marcada como leída');
      },
      error: (err) => this.toast.error(extractErrorMessage(err, 'No se pudo marcar la notificación'))
    });
  }

  saveEdits(): void {
    const notification = this.notification();
    if (!notification || this.editForm.invalid || this.saving()) return;

    this.saving.set(true);
    const value = this.editForm.getRawValue();
    this.notificationService.update(notification._id, value).subscribe({
      next: (res) => {
        this.notification.set(res.data['notification']);
        this.saving.set(false);
        this.toast.success('Notificación actualizada correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo actualizar la notificación'));
      }
    });
  }

  confirmDelete(): void {
    this.confirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  performDelete(): void {
    const notification = this.notification();
    if (!notification) return;

    this.deleting.set(true);
    this.notificationService.remove(notification._id).subscribe({
      next: () => {
        this.toast.success('Notificación eliminada correctamente');
        this.router.navigate(['/notifications']);
      },
      error: (err) => {
        this.deleting.set(false);
        this.confirmingDelete.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo eliminar la notificación'));
      }
    });
  }
}
