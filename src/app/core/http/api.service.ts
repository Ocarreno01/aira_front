import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // ⚠️ luego esto puede venir de environment
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  public async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<T> {
    return firstValueFrom(
      this.http.get<T>(`${this.baseUrl}${endpoint}`, {
        params: this.buildParams(params),
      }),
    );
  }

  public async post<T>(endpoint: string, body: any): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(`${this.baseUrl}${endpoint}`, body),
    );
  }

  public async put<T>(endpoint: string, body: any): Promise<T> {
    return firstValueFrom(this.http.put<T>(`${this.baseUrl}${endpoint}`, body));
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return firstValueFrom(this.http.delete<T>(`${this.baseUrl}${endpoint}`));
  }

  private buildParams(params?: Record<string, any>): HttpParams | undefined {
    if (!params) return undefined;

    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}
