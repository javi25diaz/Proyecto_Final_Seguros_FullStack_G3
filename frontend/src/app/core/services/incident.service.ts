import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Incident } from '../models/incident.model';
import { CrudService } from './crud.service';

@Injectable({ providedIn: 'root' })
export class IncidentService extends CrudService<Incident> {
  protected readonly resourcePath = 'incidents';

  listAll(): Observable<Incident[]> {
    return this.list({ limit: 100, sort: '-createdAt' }).pipe(map((res) => res.data));
  }
}
