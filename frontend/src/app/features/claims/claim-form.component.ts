import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClaimService } from '../../core/services/claim.service';
import { IncidentService } from '../../core/services/incident.service';
import { ToastService } from '../../core/services/toast.service';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { Incident } from '../../core/models/incident.model';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './claim-form.component.html'
})
export class ClaimFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly claimService = inject(ClaimService);
  private readonly incidentService = inject(IncidentService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly claimId = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly incidents = signal<Incident[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    incident: ['', [Validators.required]],
    amountRequested: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required]],
    documentUrls: ['']
  });

  ngOnInit(): void {
    this.incidentService.listAll().subscribe((incidents) => this.incidents.set(incidents));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.claimId.set(id);
      this.isEditMode.set(true);
      this.loading.set(true);
      this.claimService.getById(id).subscribe({
        next: (res) => {
          const claim = res.data['claim'];
          this.form.patchValue({
            incident: typeof claim.incident === 'string' ? claim.incident : claim.incident._id,
            amountRequested: claim.amountRequested,
            description: claim.description,
            documentUrls: (claim.documentUrls || []).join(', ')
          });
          this.form.controls.incident.disable();
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudo cargar la reclamación'));
          this.router.navigate(['/claims']);
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
    const documentUrls = value.documentUrls
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      amountRequested: value.amountRequested,
      description: value.description,
      documentUrls
    };
    if (!this.isEditMode()) {
      payload['incident'] = value.incident;
    }

    const request = this.isEditMode()
      ? this.claimService.update(this.claimId()!, payload)
      : this.claimService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Reclamación actualizada correctamente' : 'Reclamación creada correctamente');
        this.router.navigate(['/claims']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'No se pudo guardar la reclamación'));
      }
    });
  }
}
