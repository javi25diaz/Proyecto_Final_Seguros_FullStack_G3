import { Routes } from '@angular/router';

export const PAYMENTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./payments-list.component').then((m) => m.PaymentsListComponent) },
  { path: 'new', loadComponent: () => import('./payment-form.component').then((m) => m.PaymentFormComponent) },
  { path: ':id', loadComponent: () => import('./payment-detail.component').then((m) => m.PaymentDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./payment-form.component').then((m) => m.PaymentFormComponent) }
];
