import { Routes } from '@angular/router';

export const CLAIMS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./claims-list.component').then((m) => m.ClaimsListComponent) },
  { path: 'new', loadComponent: () => import('./claim-form.component').then((m) => m.ClaimFormComponent) },
  { path: ':id', loadComponent: () => import('./claim-detail.component').then((m) => m.ClaimDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./claim-form.component').then((m) => m.ClaimFormComponent) }
];
