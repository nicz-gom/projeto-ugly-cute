import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

/** Resposta do POST /api/auth/login do backend. */
interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private readonly tokenKey = 'token';

  /*
  O tap executa um efeito colateral (salvar o token) sem alterar o valor que segue
  para quem chamou. A requisição só é disparada quando o componente faz subscribe().
  */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap(({ token }) => localStorage.setItem(this.tokenKey, token)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}
