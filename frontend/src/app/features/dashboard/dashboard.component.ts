import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminDashboardSummary, AgentDashboardSummary, DashboardService, RecentActivityItem } from '../../core/services/dashboard.service';
import { ToastService } from '../../core/services/toast.service';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import {
  claimStatusMeta,
  clientStatusMeta,
  incidentStatusMeta,
  paymentStatusMeta,
  policyStatusMeta,
  StatusMeta
} from '../../shared/utils/status-maps.util';

function isAdminSummary(summary: AdminDashboardSummary | AgentDashboardSummary): summary is AdminDashboardSummary {
  return 'totalUsers' in summary;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  Policy: 'Póliza',
  Payment: 'Pago',
  Incident: 'Siniestro',
  Claim: 'Reclamación'
};

const ENTITY_STATUS_META: Record<string, (status: string) => StatusMeta> = {
  Policy: policyStatusMeta,
  Payment: paymentStatusMeta,
  Incident: incidentStatusMeta,
  Claim: claimStatusMeta
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly summary = signal<AdminDashboardSummary | AgentDashboardSummary | null>(null);
  protected readonly recentActivity = signal<RecentActivityItem[]>([]);

  protected readonly clientStatusMeta = clientStatusMeta;
  protected readonly claimStatusMeta = claimStatusMeta;
  protected readonly paymentStatusMeta = paymentStatusMeta;

  protected entityTypeLabel(entityType: string): string {
    return ENTITY_TYPE_LABELS[entityType] ?? entityType;
  }

  protected activityStatusMeta(item: RecentActivityItem): StatusMeta {
    const resolver = ENTITY_STATUS_META[item.entityType];
    return resolver ? resolver(item.status) : { label: item.status, variant: 'neutral' };
  }

  ngOnInit(): void {
    if (this.auth.role() === 'guest') return;

    this.loading.set(true);
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        this.summary.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar el dashboard'));
      }
    });

    if (this.auth.role() === 'admin') {
      this.dashboardService.getRecentActivity().subscribe({
        next: (res) => this.recentActivity.set(res.data)
      });
    }
  }

  protected asAdmin(summary: AdminDashboardSummary | AgentDashboardSummary): AdminDashboardSummary | null {
    return isAdminSummary(summary) ? summary : null;
  }

  protected asAgent(summary: AdminDashboardSummary | AgentDashboardSummary): AgentDashboardSummary | null {
    return isAdminSummary(summary) ? null : summary;
  }
}
