import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PolicyService } from '../../core/services/policy.service';
import { ToastService } from '../../core/services/toast.service';
import { Policy } from '../../core/models/policy.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { insuranceTypeMeta, policyStatusMeta } from '../../shared/utils/status-maps.util';
import { ClientRef, UserRef } from '../../core/models/common.model';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './policy-detail.component.html'
})
export class PolicyDetailComponent implements OnInit {
  private readonly policyService = inject(PolicyService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly policy = signal<Policy | null>(null);
  protected readonly loading = signal(false);
  protected readonly policyStatusMeta = policyStatusMeta;
  protected readonly insuranceTypeMeta = insuranceTypeMeta;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.policyService.getById(id).subscribe({
      next: (res) => {
        this.policy.set(res.data['policy']);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar la póliza'));
      }
    });
  }

  clientRef(client: ClientRef | string): ClientRef | null {
    return typeof client === 'string' ? null : client;
  }

  agentName(agent: UserRef | string): string {
    return typeof agent === 'string' ? agent : agent?.name ?? '—';
  }
}
