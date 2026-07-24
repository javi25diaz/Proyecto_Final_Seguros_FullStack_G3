import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Incident, IncidentStatus } from '../models/incident.model';
import { CrudService } from './crud.service';

export interface ChangeIncidentStatusPayload {
  status: IncidentStatus;
}

@Injectable({ providedIn: 'root' })
export class IncidentService extends CrudService<Incident> {
  protected readonly resourcePath = 'incidents';
  private readonly http2 = inject(HttpClient);

  listAll(): Observable<Incident[]> {
    return this.list({ limit: 100, sort: '-createdAt' }).pipe(map((res) => res.data));
  }

  changeStatus(id: string, payload: ChangeIncidentStatusPayload): Observable<ApiSuccessResponse<{ incident: Incident }>> {
    return this.http2.patch<ApiSuccessResponse<{ incident: Incident }>>(`${environment.apiUrl}/incidents/${id}/status`, payload);
  }
}
