import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/http/api.service';

export interface ProjectCatalogOption {
  id: string | number;
  name: string;
}

export interface ProjectListItem {
  id: string | number;
  name: string;
  clientId: string | number | null;
  clientName: string;
  sellerId: string | number | null;
  sellerName: string;
  projectTypeId: string | number | null;
  businessTypeName: string;
  projectStatusId: string | number | null;
  statusCode: string;
  statusName: string;
  estimatedValue: number;
}

export interface CreateProjectPayload {
  name: string;
  clientId: string | number;
  sellerId: string | number;
  projectTypeId: string | number;
  projectStatusId: string | number;
  estimatedValue: number;
}

export type UpdateProjectPayload = CreateProjectPayload;

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

  public async getProjects(): Promise<ProjectListItem[]> {
    const response = await this.apiService.get<unknown>(this.projectsEndpoint);
    return this.normalizeProjectList(response);
  }

  public async createProject(payload: CreateProjectPayload): Promise<void> {
    await this.apiService.post<unknown>(this.projectsEndpoint, payload);
  }

  public async updateProject(
    projectId: string | number,
    payload: UpdateProjectPayload,
  ): Promise<void> {
    await this.apiService.put<unknown>(
      `${this.projectsEndpoint}/${projectId}`,
      payload,
    );
  }

  public async deleteProject(projectId: string | number): Promise<void> {
    await this.apiService.delete<unknown>(`${this.projectsEndpoint}/${projectId}`);
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

  private normalizeProjectList(response: unknown): ProjectListItem[] {
    return this.unwrapArray<Record<string, unknown>>(response).map(
      (project, index) => {
        const id = this.toId(project['id']) ?? index + 1;
        const name = this.toString(
          project['name'] ??
            project['projectName'] ??
            project['title'] ??
            this.readNested(project, 'project', 'name'),
          'Sin nombre',
        );
        const clientId =
          this.toId(project['clientId']) ?? this.toIdNested(project, 'client', 'id');
        const clientName = this.toString(
          project['clientName'] ??
            this.readNested(project, 'client', 'name') ??
            this.readNested(project, 'client', 'fullName'),
          'Sin cliente',
        );
        const sellerId =
          this.toId(project['sellerId']) ?? this.toIdNested(project, 'seller', 'id');
        const sellerName = this.toString(
          project['sellerName'] ??
            this.readNested(project, 'seller', 'name') ??
            this.readNested(project, 'seller', 'fullName'),
          'Sin vendedor',
        );
        const projectTypeId =
          this.toId(project['projectTypeId']) ??
          this.toId(project['businessTypeId']) ??
          this.toIdNested(project, 'projectType', 'id') ??
          this.toIdNested(project, 'businessType', 'id');
        const businessTypeName = this.toString(
          project['businessTypeName'] ??
            project['businessType'] ??
            this.readNested(project, 'projectType', 'name') ??
            this.readNested(project, 'businessType', 'name') ??
            this.readNested(project, 'type', 'name'),
          'Sin tipo',
        );
        const projectStatusId =
          this.toId(project['projectStatusId']) ??
          this.toId(project['statusId']) ??
          this.toIdNested(project, 'projectStatus', 'id') ??
          this.toIdNested(project, 'status', 'id');
        const rawStatusName = this.toString(
          project['statusName'] ??
            project['status'] ??
            this.readNested(project, 'projectStatus', 'name') ??
            this.readNested(project, 'status', 'name') ??
            this.readNested(project, 'projectStatus', 'code') ??
            this.readNested(project, 'status', 'code'),
          'desconocido',
        );
        const statusCode = this.toString(
          project['statusCode'] ??
            this.readNested(project, 'projectStatus', 'code') ??
            this.readNested(project, 'status', 'code'),
          this.toStatusCode(rawStatusName),
        );

        return {
          id,
          name,
          clientId,
          clientName,
          sellerId,
          sellerName,
          projectTypeId,
          businessTypeName,
          projectStatusId,
          statusCode,
          statusName: rawStatusName,
          estimatedValue:
            this.toNumber(
              project['estimatedValue'] ??
                project['estimatedAmount'] ??
                project['amount'],
            ) ?? 0,
        };
      },
    );
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

  private toIdNested(
    source: Record<string, unknown>,
    firstKey: string,
    secondKey: string,
  ): string | number | null {
    return this.toId(this.readNested(source, firstKey, secondKey));
  }

  private toId(value: unknown): string | number | null {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
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

  private toString(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    return fallback;
  }

  private toStatusCode(status: string): string {
    return status
      .trim()
      .toLowerCase()
      .replaceAll('-', '_')
      .replaceAll(' ', '_');
  }

  private isPrimitive(value: unknown): value is string | number {
    return typeof value === 'string' || typeof value === 'number';
  }
}
