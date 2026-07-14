import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class UserService extends CrudService<User> {
  protected readonly resourcePath = 'users';

  listActiveAgents(): Observable<User[]> {
    return this.list({ status: 'active', limit: 100 }).pipe(
      map((res) => res.data.filter((u) => u.role === 'user' || u.role === 'admin'))
    );
  }
}
