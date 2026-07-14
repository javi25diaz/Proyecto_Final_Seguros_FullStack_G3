import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="card" style="max-width: 480px; margin: 3rem auto; text-align: center;">
      <h1>403 · Acceso denegado</h1>
      <p class="text-muted">No posee permisos suficientes para acceder a este recurso.</p>
      <a routerLink="/dashboard" class="btn btn-primary">Volver al dashboard</a>
    </div>
  `
})
export class ForbiddenComponent {}
