import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastContainerComponent } from '../shared/components/toast-container.component';

interface MenuItem {
  label: string;
  path: string;
  roles: Array<'guest' | 'user' | 'admin'>;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard', roles: ['guest', 'user', 'admin'] },
  { label: 'Usuarios', path: '/users', roles: ['admin'] },
  { label: 'Clientes', path: '/clients', roles: ['user', 'admin'] },
  { label: 'Pólizas', path: '/policies', roles: ['user', 'admin'] },
  { label: 'Pagos', path: '/payments', roles: ['user', 'admin'] },
  { label: 'Siniestros', path: '/incidents', roles: ['user', 'admin'] },
  { label: 'Reclamaciones', path: '/claims', roles: ['user', 'admin'] },
  { label: 'Notificaciones', path: '/notifications', roles: ['user', 'admin'] },
  { label: 'Perfil', path: '/profile', roles: ['guest', 'user', 'admin'] }
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly sidebarOpen = signal(false);

  protected readonly menuItems = MENU_ITEMS;

  get visibleMenuItems(): MenuItem[] {
    const role = this.auth.role();
    if (!role) return [];
    return this.menuItems.filter((item) => item.roles.includes(role));
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
