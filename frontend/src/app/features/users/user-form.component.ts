import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import { passwordPolicyValidator } from '../../shared/validators/password.validator';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly userId = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['guest', [Validators.required]],
    status: ['active', [Validators.required]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.isEditMode.set(true);
      this.loading.set(true);
      this.userService.getById(id).subscribe({
        next: (res) => {
          const user = res.data['user'];
          this.form.patchValue({ name: user.name, email: user.email, role: user.role, status: user.status });
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(extractErrorMessage(err, 'No se pudo cargar el usuario'));
          this.router.navigate(['/users']);
        }
      });
    } else {
      this.form.controls.password.addValidators([Validators.required, passwordPolicyValidator()]);
    }

    if (this.isEditMode()) {
      this.form.controls.password.addValidators(passwordPolicyValidator());
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
      email: value.email,
      role: value.role,
      status: value.status
    };
    if (value.password) {
      payload['password'] = value.password;
    }

    const request = this.isEditMode()
      ? this.userService.update(this.userId()!, payload)
      : this.userService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'No se pudo guardar el usuario'));
      }
    });
  }
}
