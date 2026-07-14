import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./users-list.component').then((m) => m.UsersListComponent) },
  { path: 'new', loadComponent: () => import('./user-form.component').then((m) => m.UserFormComponent) },
  { path: ':id', loadComponent: () => import('./user-detail.component').then((m) => m.UserDetailComponent) },
  { path: ':id/edit', loadComponent: () => import('./user-form.component').then((m) => m.UserFormComponent) }
];
