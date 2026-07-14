import { Component, Input } from '@angular/core';
import { BadgeVariant } from '../utils/status-maps.util';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge-' + variant">{{ label }}</span>`
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() variant: BadgeVariant = 'neutral';
}
