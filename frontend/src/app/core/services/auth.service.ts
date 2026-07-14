import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { AuthSession, User } from '../models/user.model';

const TOKEN_KEY = 'insuretech_token';
const USER_KEY = 'insuretech_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly role = computed(() => this.currentUserSignal()?.role ?? null);

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  register(payload: { name: string; email: string; password: string }): Observable<ApiSuccessResponse<{ user: User }>> {
    return this.http.post<ApiSuccessResponse<{ user: User }>>(`${this.apiUrl}/register`, payload);
  }

  login(email: string, password: string): Observable<ApiSuccessResponse<AuthSession>> {
    return this.http.post<ApiSuccessResponse<AuthSession>>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => this.persistSession(res.data))
    );
  }

  fetchMe(): Observable<ApiSuccessResponse<{ user: User }>> {
    return this.http.get<ApiSuccessResponse<{ user: User }>>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        this.currentUserSignal.set(res.data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      })
    );
  }

  private persistSession(session: AuthSession): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.currentUserSignal.set(session.user);
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }
}
