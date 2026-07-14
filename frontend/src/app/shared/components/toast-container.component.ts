import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type">
          {{ toast.message }}
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
