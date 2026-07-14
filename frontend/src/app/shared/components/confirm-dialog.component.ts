import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="onCancel()">
      <div class="modal-panel" role="alertdialog" aria-modal="true" [attr.aria-label]="title" (click)="$event.stopPropagation()">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()" [disabled]="busy">Cancelar</button>
          <button type="button" class="btn btn-danger" (click)="onConfirm()" [disabled]="busy">
            {{ busy ? 'Eliminando...' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Está seguro de que desea continuar? Esta acción es real y no se puede deshacer.';
  @Input() confirmLabel = 'Eliminar';
  @Input() busy = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    if (!this.busy) {
      this.cancelled.emit();
    }
  }
}
