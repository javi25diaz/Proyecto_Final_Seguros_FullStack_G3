import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { Payment } from '../../core/models/payment.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { paymentMethodLabels, paymentStatusMeta } from '../../shared/utils/status-maps.util';
import { ClientRef, PolicyRef } from '../../core/models/common.model';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './payment-detail.component.html'
})
export class PaymentDetailComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly payment = signal<Payment | null>(null);
  protected readonly loading = signal(false);
  protected readonly paymentStatusMeta = paymentStatusMeta;
  protected readonly paymentMethodLabels = paymentMethodLabels;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.paymentService.getById(id).subscribe({
      next: (res) => {
        this.payment.set(res.data['payment']);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar el pago'));
      }
    });
  }

  clientRef(client: ClientRef | string): ClientRef | null {
    return typeof client === 'string' ? null : client;
  }

  policyRef(policy: PolicyRef | string): PolicyRef | null {
    return typeof policy === 'string' ? null : policy;
  }
}
