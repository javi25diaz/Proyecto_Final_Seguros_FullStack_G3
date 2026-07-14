import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./notifications-list.component').then((m) => m.NotificationsListComponent) },
  { path: ':id', loadComponent: () => import('./notification-detail.component').then((m) => m.NotificationDetailComponent) }
];
