import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { AppNotification } from '../models/notification.model';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class NotificationService extends CrudService<AppNotification> {
  protected readonly resourcePath = 'notifications';
  private readonly http2 = inject(HttpClient);

  markAsRead(id: string): Observable<ApiSuccessResponse<{ notification: AppNotification }>> {
    return this.http2.patch<ApiSuccessResponse<{ notification: AppNotification }>>(`${environment.apiUrl}/notifications/${id}/read`, {});
  }
}
