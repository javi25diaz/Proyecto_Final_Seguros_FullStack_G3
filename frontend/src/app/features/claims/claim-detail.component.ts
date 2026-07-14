import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClaimService } from '../../core/services/claim.service';
import { ToastService } from '../../core/services/toast.service';
import { Claim, ClaimStatus } from '../../core/models/claim.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { claimStatusMeta } from '../../shared/utils/status-maps.util';
import { ClientRef, IncidentRef, PolicyRef } from '../../core/models/common.model';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './claim-detail.component.html'
})
export class ClaimDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly claimService = inject(ClaimService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly claim = signal<Claim | null>(null);
  protected readonly loading = signal(false);
  protected readonly changingStatus = signal(false);
  protected readonly statusErrorMessage = signal<string | null>(null);
  protected readonly claimStatusMeta = claimStatusMeta;

  protected readonly statusForm = this.fb.nonNullable.group({
    status: ['received' as ClaimStatus, [Validators.required]],
    amountApproved: [0],
    resolutionNotes: ['']
  });

  protected readonly requiresAmountApproved = signal(false);
  protected readonly requiresResolutionNotes = signal(false);

  ngOnInit(): void {
    this.loadClaim();

    this.statusForm.controls.status.valueChanges.subscribe((status) => {
      const amountApprovedControl = this.statusForm.controls.amountApproved;
      const resolutionNotesControl = this.statusForm.controls.resolutionNotes;

      amountApprovedControl.clearValidators();
      resolutionNotesControl.clearValidators();

      this.requiresAmountApproved.set(status === 'approved');
      this.requiresResolutionNotes.set(status === 'rejected');

      if (status === 'approved') {
        amountApprovedControl.setValidators([Validators.required, Validators.min(0)]);
      }
      if (status === 'rejected') {
        resolutionNotesControl.setValidators([Validators.required]);
      }
      amountApprovedControl.updateValueAndValidity();
      resolutionNotesControl.updateValueAndValidity();
    });
  }

  private loadClaim(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.claimService.getById(id).subscribe({
      next: (res) => {
        const claim = res.data['claim'];
        this.claim.set(claim);
        this.statusForm.patchValue({
          status: claim.status,
          amountApproved: claim.amountApproved ?? 0,
          resolutionNotes: claim.resolutionNotes ?? ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err, 'No se pudo cargar la reclamación'));
      }
    });
  }

  clientRef(client: ClientRef | string): ClientRef | null {
    return typeof client === 'string' ? null : client;
  }

  policyRef(policy: PolicyRef | string): PolicyRef | null {
    return typeof policy === 'string' ? null : policy;
  }

  incidentRef(incident: IncidentRef | string): IncidentRef | null {
    return typeof incident === 'string' ? null : incident;
  }

  submitStatusChange(): void {
    const claim = this.claim();
    if (!claim || this.statusForm.invalid || this.changingStatus()) {
      this.statusForm.markAllAsTouched();
      return;
    }

    this.changingStatus.set(true);
    this.statusErrorMessage.set(null);

    const value = this.statusForm.getRawValue();
    const payload: { status: ClaimStatus; amountApproved?: number; resolutionNotes?: string } = { status: value.status };
    if (value.status === 'approved') payload.amountApproved = value.amountApproved;
    if (value.status === 'rejected') payload.resolutionNotes = value.resolutionNotes;
    if (value.resolutionNotes) payload.resolutionNotes = value.resolutionNotes;

    this.claimService.changeStatus(claim._id, payload).subscribe({
      next: (res) => {
        this.claim.set(res.data.claim);
        this.changingStatus.set(false);
        this.toast.success('Estado de la reclamación actualizado correctamente');
      },
      error: (err) => {
        this.changingStatus.set(false);
        this.statusErrorMessage.set(extractErrorMessage(err, 'No se pudo actualizar el estado'));
      }
    });
  }
}
