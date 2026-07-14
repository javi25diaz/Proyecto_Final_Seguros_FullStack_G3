import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-access-pending',
  standalone: true,
  template: `
    <div class="card" style="max-width: 520px; margin: 2rem auto; text-align: center;">
      <h1>Acceso pendiente de autorización</h1>
      <p class="text-muted">
        Hola {{ auth.currentUser()?.name }}, su cuenta fue creada con el rol
        <strong>invitado</strong>. Un administrador debe asignarle el rol de agente
        para que pueda operar los módulos de clientes, pólizas, pagos, siniestros,
        reclamaciones y notificaciones.
      </p>
      <p class="text-muted">Mientras tanto puede consultar su perfil o cerrar sesión.</p>
    </div>
  `
})
export class AccessPendingComponent {
  protected readonly auth = inject(AuthService);
}
