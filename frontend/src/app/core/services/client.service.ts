import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Client, ClientHistory } from '../models/client.model';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class ClientService extends CrudService<Client> {
  protected readonly resourcePath = 'clients';
  private readonly http2 = inject(HttpClient);

  getHistory(id: string): Observable<ApiSuccessResponse<ClientHistory>> {
    return this.http2.get<ApiSuccessResponse<ClientHistory>>(`${environment.apiUrl}/clients/${id}/history`);
  }

  listActiveClients(): Observable<Client[]> {
    return this.list({ status: 'active', limit: 100 }).pipe(map((res) => res.data));
  }
}
