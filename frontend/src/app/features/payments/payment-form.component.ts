import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { PolicyService } from '../../core/services/policy.service';
import { ToastService } from '../../core/services/toast.service';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { Policy } from '../../core/models/policy.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './payment-form.component.html'
})
export class PaymentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly policyService = inject(PolicyService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly paymentId = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly policies = signal<Policy[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    policy: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentDate: ['', [Validators.required]],
    method: ['cash', [Validators.required]],
    status: ['pending', [Validators.required]],
    reference: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.policyService.listAll().subscribe((policies) => this.policies.set(policies));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.paymentId.set(id);
      this.isEditMode.set(true);
      this.loading.set(true);
      this.paymentService.getById(id).subscribe({
        next: (res) => {
          const payment = res.data['payment'];
          this.form.patchValue({
            policy: typeof payment.policy === 'string' ? payment.policy : payment.policy._id,
            amount: payment.amount,
            paymentDate: payment.paymentDate.substring(0, 10),
            method: payment.method,
            status: payment.status,
            reference: payment.reference || '',
            notes: payment.notes || ''
          });
          this.form.controls.policy.disable();
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudo cargar el pago'));
          this.router.navigate(['/payments']);
        }
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      amount: value.amount,
      paymentDate: value.paymentDate,
      method: value.method,
      status: value.status,
      reference: value.reference || undefined,
      notes: value.notes || undefined
    };
    if (!this.isEditMode()) {
      payload['policy'] = value.policy;
    }

    const request = this.isEditMode()
      ? this.paymentService.update(this.paymentId()!, payload)
      : this.paymentService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Pago actualizado correctamente' : 'Pago registrado correctamente');
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'No se pudo guardar el pago'));
      }
    });
  }
}
