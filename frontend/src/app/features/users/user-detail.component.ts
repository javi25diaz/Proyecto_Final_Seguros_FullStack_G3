import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { userRoleMeta, userStatusMeta } from '../../shared/utils/status-maps.util';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './user-detail.component.html'
})
export class UserDetailComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly user = signal<User | null>(null);
  protected readonly loading = signal(false);
  protected readonly userRoleMeta = userRoleMeta;
  protected readonly userStatusMeta = userStatusMeta;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.userService.getById(id).subscribe({
      next: (res) => {
        this.user.set(res.data['user']);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar el usuario'));
      }
    });
  }
}
