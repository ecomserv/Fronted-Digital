import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, AuthResponse } from './api.service';
import { catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<{ username: string; name: string; role: string } | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.isAuthenticated.set(true);
      this.currentUser.set(JSON.parse(user));
    }
  }

  login(username: string, password: string): Observable<AuthResponse | null> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.apiService.login(username, password).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        const message = err.error?.message || 'Usuario o contraseña incorrectos';
        this.error.set(message);
        return of(null);
      })
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify({
      username: response.username,
      name: response.name,
      role: response.role
    }));
    this.isAuthenticated.set(true);
    this.currentUser.set({
      username: response.username,
      name: response.name,
      role: response.role
    });
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  updateName(newName: string, newUsername?: string): Observable<boolean> {
    return this.apiService.updateProfile(newName, newUsername).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        const user = { username: response.username, name: response.name, role: response.role };
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
      }),
      tap(() => {}),
      catchError(() => of(false)),
      tap(() => {})
    ) as Observable<any>;
  }
}
