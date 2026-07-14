import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent)
      },
      {
        path: 'access-pending',
        loadComponent: () => import('./features/access-pending/access-pending.component').then((m) => m.AccessPendingComponent)
      },
      {
        path: 'clients',
        canActivate: [roleGuard(['user', 'admin'])],
        loadChildren: () => import('./features/clients/clients.routes').then((m) => m.CLIENTS_ROUTES)
      },
      {
        path: 'policies',
        canActivate: [roleGuard(['user', 'admin'])],
        loadChildren: () => import('./features/policies/policies.routes').then((m) => m.POLICIES_ROUTES)
      },
      {
        path: 'payments',
        canActivate: [roleGuard(['user', 'admin'])],
        loadChildren: () => import('./features/payments/payments.routes').then((m) => m.PAYMENTS_ROUTES)
      },
      {
        path: 'incidents',
        canActivate: [roleGuard(['user', 'admin'])],
        loadChildren: () => import('./features/incidents/incidents.routes').then((m) => m.INCIDENTS_ROUTES)
      },
      {
        path: 'claims',
        canActivate: [roleGuard(['user', 'admin'])],
        loadChildren: () => import('./features/claims/claims.routes').then((m) => m.CLAIMS_ROUTES)
      },
      {
        path: 'notifications',
        canActivate: [roleGuard(['user', 'admin'])],
        loadChildren: () => import('./features/notifications/notifications.routes').then((m) => m.NOTIFICATIONS_ROUTES)
      },
      {
        path: 'users',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES)
      },
      { path: 'forbidden', loadComponent: () => import('./features/errors/forbidden.component').then((m) => m.ForbiddenComponent) }
    ]
  },
  { path: 'not-found', loadComponent: () => import('./features/errors/not-found.component').then((m) => m.NotFoundComponent) },
  { path: '**', redirectTo: 'not-found' }
];
