import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/http/api.service';

export interface ProjectCatalogOption {
  id: string | number;
  name: string;
  code?: string;
}

export interface ProjectListItem {
  id: string | number;
  name: string;
  project: string;
  clientId: string | number | null;
  clientName: string;
  sellerId: string | number | null;
  sellerName: string;
  sellerEmail: string;
  businessTypeId: string | number | null;
  typeId: string | number | null;
  projectTypeId: string | number | null;
  businessTypeName: string;
  typeName: string;
  statusId: string | number | null;
  projectStatusId: string | number | null;
  statusCode: string;
  statusName: string;
  generaBitacora: boolean;
  negotiationId?: string | number | null;
  estimatedValue: string | number;
  createdAt: string;
  updatedAt: string;
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
  private readonly statusWithBitacoraEndpoint = '/projects/statusWithBitacora';
  private readonly typesEndpoint = '/projects/types';

  constructor(private readonly apiService: ApiService) {}

  public async getProjects(): Promise<ProjectListItem[]> {
    const response = await this.apiService.get<unknown>(this.projectsEndpoint);
    return this.normalizeProjectList(response);
  }

  public async createProject(
    payload: CreateProjectPayload,
  ): Promise<string | number | null> {
    const response = await this.apiService.post<unknown>(
      this.projectsEndpoint,
      payload,
    );
    return this.extractCreatedProjectId(response);
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
    await this.apiService.delete<unknown>(
      `${this.projectsEndpoint}/${projectId}`,
    );
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

  public async getStatusWithBitacora(): Promise<ProjectCatalogOption | null> {
    const response = await this.apiService.get<unknown>(
      this.statusWithBitacoraEndpoint,
    );
    return this.normalizeSingleCatalogOption(response);
  }

  private normalizeCatalog(response: unknown): ProjectCatalogOption[] {
    return this.unwrapArray<Record<string, unknown>>(response)
      .map((item): ProjectCatalogOption | null => {
        const rawId = item['id'] ?? item['value'] ?? item['code'];
        const rawName =
          item['name'] ?? item['label'] ?? item['description'] ?? item['title'];
        const rawCode = item['code'] ?? item['statusCode'] ?? item['value'];

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
          code:
            typeof rawCode === 'string' || typeof rawCode === 'number'
              ? this.toStatusCode(String(rawCode))
              : this.toStatusCode(rawName.trim()),
        };
      })
      .filter((item): item is ProjectCatalogOption => item !== null);
  }

  private normalizeSingleCatalogOption(
    response: unknown,
  ): ProjectCatalogOption | null {
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const objectResponse = response as Record<string, unknown>;
      const directOption = this.toCatalogOption(objectResponse);
      if (directOption !== null) {
        return directOption;
      }

      const data = objectResponse['data'];
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return this.toCatalogOption(data as Record<string, unknown>);
      }
    }

    const options = this.normalizeCatalog(response);
    return options[0] ?? null;
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
          this.toId(project['clientId']) ??
          this.toIdNested(project, 'client', 'id');
        const clientName = this.toString(
          project['clientName'] ??
            this.readNested(project, 'client', 'name') ??
            this.readNested(project, 'client', 'fullName'),
          'Sin cliente',
        );
        const sellerId =
          this.toId(project['sellerId']) ??
          this.toIdNested(project, 'seller', 'id');
        const sellerName = this.toString(
          project['sellerName'] ??
            this.readNested(project, 'seller', 'name') ??
            this.readNested(project, 'seller', 'fullName'),
          'Sin vendedor',
        );
        const sellerEmail = this.toString(
          project['sellerEmail'] ?? this.readNested(project, 'seller', 'email'),
          '',
        );
        const businessTypeId =
          this.toId(project['businessTypeId']) ??
          this.toId(project['typeId']) ??
          this.toId(project['projectTypeId']) ??
          this.toIdNested(project, 'businessType', 'id') ??
          this.toIdNested(project, 'type', 'id') ??
          this.toIdNested(project, 'projectType', 'id');
        const businessTypeName = this.toString(
          project['businessTypeName'] ??
            project['businessType'] ??
            this.readNested(project, 'businessType', 'name') ??
            this.readNested(project, 'projectType', 'name') ??
            this.readNested(project, 'type', 'name'),
          'Sin tipo',
        );
        const statusId =
          this.toId(project['statusId']) ??
          this.toId(project['projectStatusId']) ??
          this.toIdNested(project, 'status', 'id') ??
          this.toIdNested(project, 'projectStatus', 'id');
        const rawStatusName = this.toString(
          project['statusName'] ??
            project['status'] ??
            this.readNested(project, 'status', 'name') ??
            this.readNested(project, 'projectStatus', 'name') ??
            this.readNested(project, 'status', 'code'),
          'desconocido',
        );
        const statusCode = this.toString(
          project['statusCode'] ??
            this.readNested(project, 'status', 'code') ??
            this.readNested(project, 'projectStatus', 'code'),
          this.toStatusCode(rawStatusName),
        );
        const estimatedValue =
          this.toNumber(
            project['estimatedValue'] ??
              project['estimatedAmount'] ??
              project['amount'],
          ) ?? 0;
        const createdAt = this.toString(project['createdAt'], '');
        const updatedAt = this.toString(project['updatedAt'], '');
        const generaBitacora =
          this.toBoolean(project['generaBitacora']) ??
          this.toBoolean(this.readNested(project, 'status', 'generaBitacora')) ??
          this.toBoolean(
            this.readNested(project, 'projectStatus', 'generaBitacora'),
          ) ??
          false;
        const negotiationId =
          this.toId(project['negotiationId']) ??
          this.toIdNested(project, 'negotiation', 'id');

        return {
          id,
          name,
          project: name,
          clientId,
          clientName,
          sellerId,
          sellerName,
          sellerEmail,
          businessTypeId,
          typeId: businessTypeId,
          projectTypeId: businessTypeId,
          businessTypeName,
          typeName: businessTypeName,
          statusId,
          projectStatusId: statusId,
          statusCode,
          statusName: rawStatusName,
          generaBitacora,
          negotiationId,
          estimatedValue: estimatedValue.toString(),
          createdAt,
          updatedAt,
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

      const projects = objectResponse['projects'];
      if (Array.isArray(projects)) {
        return projects as T[];
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

  private toBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === 'true') {
        return true;
      }

      if (normalizedValue === 'false') {
        return false;
      }
    }

    if (typeof value === 'number') {
      if (value === 1) {
        return true;
      }

      if (value === 0) {
        return false;
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
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replaceAll('-', '_')
      .replaceAll(' ', '_');
  }

  private toCatalogOption(
    item: Record<string, unknown>,
  ): ProjectCatalogOption | null {
    const rawId = item['id'] ?? item['value'] ?? item['code'];
    const rawName =
      item['name'] ?? item['label'] ?? item['description'] ?? item['title'];
    const rawCode = item['code'] ?? item['statusCode'] ?? item['value'];

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
      code:
        typeof rawCode === 'string' || typeof rawCode === 'number'
          ? this.toStatusCode(String(rawCode))
          : this.toStatusCode(rawName.trim()),
    };
  }

  private extractCreatedProjectId(response: unknown): string | number | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const objectResponse = response as Record<string, unknown>;
    const directId = this.toId(objectResponse['id']);
    if (directId !== null) {
      return directId;
    }

    const data = objectResponse['data'];
    if (data && typeof data === 'object') {
      return this.toId((data as Record<string, unknown>)['id']);
    }

    const project = objectResponse['project'];
    if (project && typeof project === 'object') {
      return this.toId((project as Record<string, unknown>)['id']);
    }

    return null;
  }

  private isPrimitive(value: unknown): value is string | number {
    return typeof value === 'string' || typeof value === 'number';
  }
}
