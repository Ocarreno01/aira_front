import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/http/api.service';

export interface ProjectCatalogOption {
  id: string | number;
  name: string;
}

export interface ProjectListItem {
  id: number;
  clientName: string;
  sellerName: string;
  businessType: string;
  estimatedValue: number;
  status: string;
}

export interface CreateProjectPayload {
  name: string;
  clientId: string | number;
  sellerId: string | number;
  projectTypeId: string | number;
  projectStatusId: string | number;
  estimatedValue: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private readonly projectsEndpoint = '/projects';
  private readonly clientsEndpoint = '/projects/clients';
  private readonly sellersEndpoint = '/projects/sellers';
  private readonly statusesEndpoint = '/projects/statuses';
  private readonly typesEndpoint = '/projects/types';

  constructor(private readonly apiService: ApiService) {}

  public async getProjects(): Promise<unknown[]> {
    const response = await this.apiService.get<unknown>(this.projectsEndpoint);
    return this.normalizeProjectList(response);
  }

  public async createProject(payload: CreateProjectPayload): Promise<void> {
    console.log('payload', payload);
    await this.apiService.post<unknown>(this.projectsEndpoint, payload);
  }

  public async getClients(): Promise<ProjectCatalogOption[]> {
    const response = await this.apiService.get<unknown>(this.clientsEndpoint);
    return this.normalizeCatalog(response);
  }

  public async getSellers(): Promise<ProjectCatalogOption[]> {
    const response = await this.apiService.get<unknown>(this.sellersEndpoint);
    return this.normalizeCatalog(response);
  }

  public async getStatuses(): Promise<ProjectCatalogOption[]> {
    const response = await this.apiService.get<unknown>(this.statusesEndpoint);
    return this.normalizeCatalog(response);
  }

  public async getProjectTypes(): Promise<ProjectCatalogOption[]> {
    const response = await this.apiService.get<unknown>(this.typesEndpoint);
    return this.normalizeCatalog(response);
  }

  private normalizeCatalog(response: unknown): ProjectCatalogOption[] {
    return this.unwrapArray<Record<string, unknown>>(response)
      .map((item) => {
        const rawId = item['id'] ?? item['value'] ?? item['code'];
        const rawName =
          item['name'] ?? item['label'] ?? item['description'] ?? item['title'];

        if (
          !this.isPrimitive(rawId) ||
          typeof rawName !== 'string' ||
          !rawName.trim()
        ) {
          return null;
        }

        return {
          id: rawId,
          name: rawName.trim(),
        };
      })
      .filter((item): item is ProjectCatalogOption => item !== null);
  }

  private normalizeProjectList(response: unknown): unknown[] {
    return this.unwrapArray<Record<string, unknown>>(response);
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

  private toString(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    return fallback;
  }

  private isPrimitive(value: unknown): value is string | number {
    return typeof value === 'string' || typeof value === 'number';
  }
}
