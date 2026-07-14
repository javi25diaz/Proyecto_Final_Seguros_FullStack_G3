import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-form.component.html'
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly clientId = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly agents = signal<User[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    identification: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    status: ['active', [Validators.required]],
    assignedAgent: [''],
    notes: ['']
  });

  get isAdmin(): boolean {
    return this.auth.role() === 'admin';
  }

  ngOnInit(): void {
    if (this.isAdmin) {
      this.form.controls.assignedAgent.addValidators(Validators.required);
      this.userService.listActiveAgents().subscribe((agents) => this.agents.set(agents));
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientId.set(id);
      this.isEditMode.set(true);
      this.loading.set(true);
      this.clientService.getById(id).subscribe({
        next: (res) => {
          const client = res.data['client'];
          this.form.patchValue({
            name: client.name,
            identification: client.identification,
            phone: client.phone,
            email: client.email,
            address: client.address,
            status: client.status,
            assignedAgent: typeof client.assignedAgent === 'string' ? client.assignedAgent : client.assignedAgent._id,
            notes: client.notes || ''
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudo cargar el cliente'));
          this.router.navigate(['/clients']);
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
      name: value.name,
      identification: value.identification,
      phone: value.phone,
      email: value.email,
      address: value.address,
      status: value.status,
      notes: value.notes || undefined
    };
    if (value.assignedAgent) {
      payload['assignedAgent'] = value.assignedAgent;
    }

    const request = this.isEditMode()
      ? this.clientService.update(this.clientId()!, payload)
      : this.clientService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'No se pudo guardar el cliente'));
      }
    });
  }
}
