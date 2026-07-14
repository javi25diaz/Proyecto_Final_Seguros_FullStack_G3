import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Claim, ClaimStatus } from '../models/claim.model';
import { CrudService } from './crud.service';

export interface ChangeClaimStatusPayload {
  status: ClaimStatus;
  amountApproved?: number;
  resolutionNotes?: string;
}

@Injectable({ providedIn: 'root' })
export class ClaimService extends CrudService<Claim> {
  protected readonly resourcePath = 'claims';
  private readonly http2 = inject(HttpClient);

  changeStatus(id: string, payload: ChangeClaimStatusPayload): Observable<ApiSuccessResponse<{ claim: Claim }>> {
    return this.http2.patch<ApiSuccessResponse<{ claim: Claim }>>(`${environment.apiUrl}/claims/${id}/status`, payload);
  }
}
