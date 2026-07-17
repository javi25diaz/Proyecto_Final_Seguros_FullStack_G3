import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { User, UserDependenciesSnapshot } from '../../core/models/user.model';
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
  protected readonly dependencyTarget = signal<User | null>(null);
  protected readonly dependencySnapshot = signal<UserDependenciesSnapshot | null>(null);
  protected readonly replacementUsers = signal<User[]>([]);
  protected readonly selectedReplacementId = signal('');
  protected readonly dependencyLoading = signal(false);
  protected readonly reassigning = signal(false);
  protected readonly dependencyError = signal<string | null>(null);

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
    if (this.dependencyLoading() || this.deleting() || this.reassigning()) return;

    this.dependencyTarget.set(user);
    this.dependencySnapshot.set(null);
    this.replacementUsers.set([]);
    this.selectedReplacementId.set('');
    this.dependencyError.set(null);
    this.dependencyLoading.set(true);

    this.userService.getDependencies(user.id).subscribe({
      next: (res) => {
        this.dependencyLoading.set(false);
        this.dependencySnapshot.set(res.data);

        if (res.data.canDelete) {
          this.dependencyTarget.set(null);
          this.pendingDelete.set(user);
          return;
        }

        if (res.data.reassignableCount > 0) {
          this.userService.listActiveAgents(user.id).subscribe({
            next: (agents) => this.replacementUsers.set(agents),
            error: (err) => {
              this.dependencyError.set(extractErrorMessage(err, 'No se pudieron cargar los usuarios de reemplazo'));
              this.replacementUsers.set([]);
            }
          });
        }
      },
      error: (err) => {
        this.dependencyLoading.set(false);
        this.dependencyError.set(extractErrorMessage(err, 'No se pudieron consultar las dependencias del usuario'));
      }
    });
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  cancelDependencyReview(): void {
    this.dependencyTarget.set(null);
    this.dependencySnapshot.set(null);
    this.replacementUsers.set([]);
    this.selectedReplacementId.set('');
    this.dependencyLoading.set(false);
    this.reassigning.set(false);
    this.dependencyError.set(null);
  }

  onReplacementChange(value: string): void {
    this.selectedReplacementId.set(value);
  }

  reassignResponsibilities(): void {
    const user = this.dependencyTarget();
    const replacementUserId = this.selectedReplacementId();
    if (!user || !replacementUserId || this.reassigning()) return;

    this.reassigning.set(true);
    this.dependencyError.set(null);

    this.userService.reassignResponsibilities(user.id, replacementUserId).subscribe({
      next: (res) => {
        this.reassigning.set(false);
        this.dependencySnapshot.set(res.data.remainingDependencies);
        this.toast.success('Responsabilidades reasignadas correctamente');

        if (res.data.canDeleteSourceUser) {
          this.cancelDependencyReview();
          this.pendingDelete.set(user);
          return;
        }

        this.userService.listActiveAgents(user.id).subscribe({
          next: (agents) => this.replacementUsers.set(agents),
          error: (err) => this.dependencyError.set(extractErrorMessage(err, 'No se pudieron cargar los usuarios de reemplazo'))
        });
      },
      error: (err) => {
        this.reassigning.set(false);
        this.dependencyError.set(extractErrorMessage(err, 'No se pudieron reasignar las responsabilidades'));
      }
    });
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
