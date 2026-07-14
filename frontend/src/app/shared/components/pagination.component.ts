import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationMeta } from '../../core/models/api-response.model';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (meta && meta.total > 0) {
      <div class="pagination">
        <span>
          Mostrando {{ startItem }}–{{ endItem }} de {{ meta.total }}
        </span>
        <button type="button" class="btn btn-secondary btn-sm" [disabled]="meta.page <= 1" (click)="pageChange.emit(meta.page - 1)">
          Anterior
        </button>
        <span>Página {{ meta.page }} de {{ meta.pages || 1 }}</span>
        <button type="button" class="btn btn-secondary btn-sm" [disabled]="meta.page >= meta.pages" (click)="pageChange.emit(meta.page + 1)">
          Siguiente
        </button>
      </div>
    }
  `
})
export class PaginationComponent {
  @Input() meta: PaginationMeta | null = null;
  @Output() pageChange = new EventEmitter<number>();

  get startItem(): number {
    if (!this.meta || this.meta.total === 0) return 0;
    return (this.meta.page - 1) * this.meta.limit + 1;
  }

  get endItem(): number {
    if (!this.meta) return 0;
    return Math.min(this.meta.page * this.meta.limit, this.meta.total);
  }
}
