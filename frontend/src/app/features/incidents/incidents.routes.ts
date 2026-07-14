import { Routes } from '@angular/router';

export const INCIDENTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./incidents-list.component').then((m) => m.IncidentsListComponent) },
  { path: 'new', loadComponent: () => import('./incident-form.component').then((m) => m.IncidentFormComponent) },
  { path: ':id', loadComponent: () => import('./incident-detail.component').then((m) => m.IncidentDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./incident-form.component').then((m) => m.IncidentFormComponent) }
];
