import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { ClientHistory } from '../../core/models/client.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import {
  claimStatusMeta,
  clientStatusMeta,
  incidentStatusMeta,
  insuranceTypeMeta,
  paymentStatusMeta,
  policyStatusMeta
} from '../../shared/utils/status-maps.util';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './client-detail.component.html'
})
export class ClientDetailComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly history = signal<ClientHistory | null>(null);
  protected readonly loading = signal(false);

  protected readonly clientStatusMeta = clientStatusMeta;
  protected readonly policyStatusMeta = policyStatusMeta;
  protected readonly paymentStatusMeta = paymentStatusMeta;
  protected readonly incidentStatusMeta = incidentStatusMeta;
  protected readonly claimStatusMeta = claimStatusMeta;
  protected readonly insuranceTypeMeta = insuranceTypeMeta;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.clientService.getHistory(id).subscribe({
      next: (res) => {
        this.history.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar el historial del cliente'));
      }
    });
  }
}
