import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { User, UserDependenciesSnapshot, UserReassignResponse } from '../models/user.model';
import { CrudService } from './crud.service';
import { ApiSuccessResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService extends CrudService<User> {
  protected readonly resourcePath = 'users';

  private get usersUrl(): string {
    return `${environment.apiUrl}/${this.resourcePath}`;
  }

  listActiveAgents(excludeUserId?: string): Observable<User[]> {
    return this.list({ status: 'active', limit: 1000 }).pipe(
      map((res) => res.data.filter((u) => (u.role === 'user' || u.role === 'admin') && u.id !== excludeUserId))
    );
  }

  getDependencies(userId: string): Observable<ApiSuccessResponse<UserDependenciesSnapshot>> {
    return this.http.get<ApiSuccessResponse<UserDependenciesSnapshot>>(`${this.usersUrl}/${userId}/dependencies`);
  }

  reassignResponsibilities(userId: string, replacementUserId: string): Observable<ApiSuccessResponse<UserReassignResponse>> {
    return this.http.patch<ApiSuccessResponse<UserReassignResponse>>(`${this.usersUrl}/${userId}/reassign`, { replacementUserId });
  }
}
