import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/http/api.service';

const TOKEN_KEY = 'atk';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private apiService: ApiService) {}

  public isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  public setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  public async login(email: string, password: string): Promise<boolean> {
    if (email && password) {
      const response = await this.apiService.post<{
        status: boolean;
        token?: string;
        message?: string;
      }>('/auth/login', {
        email,
        password,
      });
      console.log('response', response);
      if (response && response.status) {
        this.setToken(response.token!);
        return true;
      }
    }
    return false;
  }

  public logout(): void {
    this.clearToken();
  }
}
