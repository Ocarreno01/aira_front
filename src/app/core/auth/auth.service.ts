import { Injectable } from '@angular/core';

const TOKEN_KEY = 'aira_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
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

  /**
   * MVP: Login simulado. Luego lo reemplazamos por llamada al backend.
   * Devuelve true si "autenticó" y deja token guardado.
   */
  public async login(username: string, password: string): Promise<boolean> {
    if (username && password) {
      // TODO: cambiar por token real del backend
      this.setToken('mvp-token');
      return true;
    }

    return false;
  }

  public logout(): void {
    this.clearToken();
  }
}
