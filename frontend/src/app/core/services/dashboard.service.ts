import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';

export interface AdminDashboardSummary {
  totalUsers: number;
  activeUsers: number;
  totalClients: number;
  activePolicies: number;
  pendingClaims: number;
  openIncidents: number;
  totalPaidThisMonth: number;
  unreadNotifications: number;
  recentClients: Array<{ _id: string; name: string; identification: string; status: string; createdAt: string }>;
  recentClaims: Array<{ _id: string; claimNumber: string; status: string; amountRequested: number; createdAt: string; client?: { name: string } }>;
}

export interface AgentDashboardSummary {
  myClients: number;
  myPolicies: number;
  claimsUnderAnalysis: number;
  openIncidents: number;
  recentPayments: Array<{ _id: string; receiptNumber: string; amount: number; status: string; createdAt: string; client?: { name: string } }>;
  myNotifications: Array<{ _id: string; message: string; date: string; isRead: boolean }>;
}

export interface RecentActivityItem {
  entityType: string;
  label: string;
  status: string;
  client?: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  getSummary(): Observable<ApiSuccessResponse<AdminDashboardSummary | AgentDashboardSummary>> {
    return this.http.get<ApiSuccessResponse<AdminDashboardSummary | AgentDashboardSummary>>(`${this.baseUrl}/summary`);
  }

  getRecentActivity(): Observable<ApiSuccessResponse<RecentActivityItem[]>> {
    return this.http.get<ApiSuccessResponse<RecentActivityItem[]>>(`${this.baseUrl}/recent-activity`);
  }
}
