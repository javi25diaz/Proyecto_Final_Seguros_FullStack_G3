import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Policy } from '../models/policy.model';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class PolicyService extends CrudService<Policy> {
  protected readonly resourcePath = 'policies';

  listAll(): Observable<Policy[]> {
    return this.list({ limit: 100, sort: '-createdAt' }).pipe(map((res) => res.data));
  }
}
