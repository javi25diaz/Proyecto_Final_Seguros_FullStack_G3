import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiListResponse, ApiSuccessResponse, ListQueryParams } from '../models/api-response.model';

@Injectable()
export abstract class CrudService<T> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly resourcePath: string;

  private get baseUrl(): string {
    return `${environment.apiUrl}/${this.resourcePath}`;
  }

  private toHttpParams(query: ListQueryParams = {}): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  list(query: ListQueryParams = {}): Observable<ApiListResponse<T>> {
    return this.http.get<ApiListResponse<T>>(this.baseUrl, { params: this.toHttpParams(query) });
  }

  getById(id: string): Observable<ApiSuccessResponse<Record<string, T>>> {
    return this.http.get<ApiSuccessResponse<Record<string, T>>>(`${this.baseUrl}/${id}`);
  }

  create(payload: Partial<T>): Observable<ApiSuccessResponse<Record<string, T>>> {
    return this.http.post<ApiSuccessResponse<Record<string, T>>>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<T>): Observable<ApiSuccessResponse<Record<string, T>>> {
    return this.http.put<ApiSuccessResponse<Record<string, T>>>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<ApiSuccessResponse<null>> {
    return this.http.delete<ApiSuccessResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
