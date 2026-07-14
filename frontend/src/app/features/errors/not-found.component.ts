import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="card" style="max-width: 480px; margin: 3rem auto; text-align: center;">
      <h1>404 · Página no encontrada</h1>
      <p class="text-muted">La ruta solicitada no existe.</p>
      <a routerLink="/dashboard" class="btn btn-primary">Volver al dashboard</a>
    </div>
  `
})
export class NotFoundComponent {}
