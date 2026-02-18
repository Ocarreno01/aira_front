import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/http/api.service';

export interface NegotiationListItem {
  id: string;
  projectName: string;
  clientName: string;
  createdAt: string | null;
}

export interface NegotiationLogItem {
  id: string;
  date: string | null;
  description: string;
  sellerName: string;
}

export interface NegotiationDetail {
  id: string;
  projectId: string | number | null;
  projectName: string;
  clientName: string;
  sellerName: string;
  projectTypeName: string;
  statusName: string;
  estimatedValue: number | null;
  createdAt: string | null;
  logs: NegotiationLogItem[];
}

export interface CreateNegotiationPayload {
  projectId: string | number;
  clientId: string | number;
  sellerId: string | number;
  description: string;
}

export interface CreateNegotiationLogPayload {
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class NegotiationsService {
  private readonly negotiationsEndpoint = '/negotiations';

  constructor(private readonly apiService: ApiService) {}

  public async getNegotiations(): Promise<NegotiationListItem[]> {
    const response = await this.apiService.get<unknown>(
      this.negotiationsEndpoint,
    );
    return this.normalizeNegotiationList(response);
  }

  public async createNegotiation(
    payload: CreateNegotiationPayload,
  ): Promise<void> {
    await this.apiService.post<unknown>(this.negotiationsEndpoint, payload);
  }

  public async createNegotiationLog(
    negotiationId: string,
    payload: CreateNegotiationLogPayload,
  ): Promise<void> {
    await this.apiService.post<unknown>(
      `${this.negotiationsEndpoint}/${negotiationId}/logs`,
      payload,
    );
  }

  public async getNegotiationById(
    negotiationId: string,
  ): Promise<NegotiationDetail | null> {
    const response = await this.apiService.get<unknown>(
      `${this.negotiationsEndpoint}/${negotiationId}`,
    );

    return this.normalizeNegotiationDetail(response);
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

  private normalizeNegotiationDetail(response: unknown): NegotiationDetail | null {
    const source = this.unwrapObject(response);
    if (!source) {
      return null;
    }

    const negotiation =
      this.unwrapObject(source['negotiation']) ??
      this.unwrapObject(source['data']) ??
      source;
    const project = this.unwrapObject(source['project']);
    const logsSource =
      source['logs'] ??
      negotiation['logs'] ??
      source['negotiationLogs'] ??
      source['bitacora'] ??
      source['history'];

    return {
      id: this.toString(negotiation['id'] ?? source['id'], ''),
      projectId: this.toId(
        negotiation['projectId'] ?? project?.['id'] ?? source['projectId'],
      ),
      projectName: this.toString(
        project?.['name'] ??
          project?.['projectName'] ??
          source['projectName'] ??
          this.readNested(source, 'project', 'name') ??
          this.readNested(source, 'project', 'title'),
        'Sin proyecto',
      ),
      clientName: this.toString(
        project?.['clientName'] ??
          source['clientName'] ??
          this.readNested(project ?? source, 'client', 'name') ??
          this.readNested(project ?? source, 'client', 'fullName'),
        'Sin cliente',
      ),
      sellerName: this.toString(
        project?.['sellerName'] ??
          source['sellerName'] ??
          this.readNested(project ?? source, 'seller', 'name') ??
          this.readNested(source, 'project', 'sellerName') ??
          this.readNestedDeep(source, ['project', 'seller', 'name']),
        'Sin vendedor',
      ),
      projectTypeName: this.toString(
        project?.['businessTypeName'] ??
          project?.['projectTypeName'] ??
          source['projectTypeName'] ??
          this.readNested(project ?? source, 'businessType', 'name') ??
          this.readNested(project ?? source, 'projectType', 'name') ??
          this.readNested(source, 'project', 'businessTypeName') ??
          this.readNestedDeep(source, ['project', 'projectType', 'name']),
        'Sin tipo',
      ),
      statusName: this.toString(
        project?.['statusName'] ??
          source['statusName'] ??
          this.readNested(project ?? source, 'status', 'name') ??
          this.readNested(source, 'project', 'statusName') ??
          this.readNestedDeep(source, ['project', 'projectStatus', 'name']) ??
          this.readNestedDeep(source, ['project', 'status', 'name']),
        'Sin estado',
      ),
      estimatedValue:
        this.toNumber(
          project?.['estimatedValue'] ??
            project?.['estimatedAmount'] ??
            source['estimatedValue'] ??
            source['estimatedAmount'] ??
            this.readNested(source, 'project', 'estimatedValue') ??
            this.readNested(source, 'project', 'estimatedAmount') ??
            this.readNested(source, 'project', 'amount'),
        ) ?? null,
      createdAt: this.toDateString(negotiation['createdAt'] ?? source['createdAt']),
      logs: this.normalizeNegotiationLogs(logsSource),
    };
  }

  private normalizeNegotiationLogs(response: unknown): NegotiationLogItem[] {
    return this.unwrapArray<Record<string, unknown>>(response).map((log) => ({
      id: this.toString(log['id'], ''),
      date: this.toDateString(log['date'] ?? log['createdAt']),
      description: this.toString(log['description'], 'Sin descripción'),
      sellerName: this.toString(
        log['sellerName'] ??
          this.readNested(log, 'seller', 'name') ??
          this.readNested(log, 'user', 'name'),
        'Sin vendedor',
      ),
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

  private unwrapObject(response: unknown): Record<string, unknown> | null {
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const objectResponse = response as Record<string, unknown>;
      const data = objectResponse['data'];
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data as Record<string, unknown>;
      }

      return objectResponse;
    }

    return null;
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

  private readNestedDeep(
    source: Record<string, unknown>,
    keys: string[],
  ): unknown {
    let current: unknown = source;

    for (const key of keys) {
      if (!current || typeof current !== 'object') {
        return null;
      }

      current = (current as Record<string, unknown>)[key];
    }

    return current;
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

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private toId(value: unknown): string | number | null {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return null;
  }
}
