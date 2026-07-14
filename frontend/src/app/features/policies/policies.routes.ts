import { Routes } from '@angular/router';

export const POLICIES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./policies-list.component').then((m) => m.PoliciesListComponent) },
  { path: 'new', loadComponent: () => import('./policy-form.component').then((m) => m.PolicyFormComponent) },
  { path: ':id', loadComponent: () => import('./policy-detail.component').then((m) => m.PolicyDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./policy-form.component').then((m) => m.PolicyFormComponent) }
];
