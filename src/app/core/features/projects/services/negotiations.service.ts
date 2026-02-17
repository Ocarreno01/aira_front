import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/http/api.service';

export interface NegotiationListItem {
  id: string;
  projectName: string;
  clientName: string;
  createdAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class NegotiationsService {
  private readonly negotiationsEndpoint = '/negotiations';

  constructor(private readonly apiService: ApiService) {}

  public async getNegotiations(): Promise<NegotiationListItem[]> {
    const response = await this.apiService.get<unknown>(this.negotiationsEndpoint);
    return this.normalizeNegotiationList(response);
  }

  private normalizeNegotiationList(response: unknown): NegotiationListItem[] {
    return this.unwrapArray<Record<string, unknown>>(response).map((item) => ({
      id: this.toString(item['id'], ''),
      projectName: this.toString(
        item['projectName'] ??
          this.readNested(item, 'project', 'name') ??
          this.readNested(item, 'project', 'title'),
        'Sin proyecto',
      ),
      clientName: this.toString(
        item['clientName'] ??
          this.readNested(item, 'client', 'name') ??
          this.readNested(item, 'client', 'fullName'),
        'Sin cliente',
      ),
      createdAt: this.toDateString(item['createdAt'] ?? item['date']),
    }));
  }

  private unwrapArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    if (response && typeof response === 'object') {
      const objectResponse = response as Record<string, unknown>;
      const data = objectResponse['data'];
      if (Array.isArray(data)) {
        return data as T[];
      }

      const items = objectResponse['items'];
      if (Array.isArray(items)) {
        return items as T[];
      }
    }

    return [];
  }

  private readNested(
    source: Record<string, unknown>,
    firstKey: string,
    secondKey: string,
  ): unknown {
    const firstValue = source[firstKey];
    if (!firstValue || typeof firstValue !== 'object') {
      return null;
    }

    return (firstValue as Record<string, unknown>)[secondKey];
  }

  private toString(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    return fallback;
  }

  private toDateString(value: unknown): string | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsedDate = new Date(value);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }

    return null;
  }
}
