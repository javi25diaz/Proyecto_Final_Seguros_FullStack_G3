import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { PaginationMeta } from '../../core/models/api-response.model';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { userRoleMeta, userStatusMeta } from '../../shared/utils/status-maps.util';
import { extractErrorMessage } from '../../shared/utils/http-error.util';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './users-list.component.html'
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly users = signal<User[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly search = signal('');
  protected readonly roleFilter = signal('');
  protected readonly statusFilter = signal('');
  protected readonly page = signal(1);

  protected readonly userRoleMeta = userRoleMeta;
  protected readonly userStatusMeta = userStatusMeta;

  protected readonly pendingDelete = signal<User | null>(null);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userService
      .list({ page: this.page(), limit: 10, q: this.search(), role: this.roleFilter() || undefined, status: this.statusFilter() || undefined })
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudieron cargar los usuarios'));
        }
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.load();
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter.set(value);
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

  isSelf(user: User): boolean {
    return this.auth.currentUser()?.id === user.id;
  }

  confirmDelete(user: User): void {
    this.pendingDelete.set(user);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const user = this.pendingDelete();
    if (!user) return;

    this.deleting.set(true);
    this.userService.remove(user.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.success('Usuario eliminado correctamente');
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo eliminar el usuario'));
        this.pendingDelete.set(null);
      }
    });
  }
}
