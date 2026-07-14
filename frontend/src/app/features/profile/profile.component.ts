import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { userRoleMeta, userStatusMeta } from '../../shared/utils/status-maps.util';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  protected readonly auth = inject(AuthService);
  protected readonly userRoleMeta = userRoleMeta;
  protected readonly userStatusMeta = userStatusMeta;
}
