import { TitleCasePipe, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MaterialModule } from '../../../../material.module';
import {
  NegotiationDetail,
  NegotiationListItem,
  NegotiationsService,
} from '../../services/negotiations.service';
import {
  ProjectListItem,
  ProjectsService,
} from '../../services/projects.service';

interface ReportOption {
  value: string;
  label: string;
  sortNumber?: number;
}

interface ReportProjectRecord {
  project: ProjectListItem;
  projectKey: string;
  sellerKey: string;
  clientKey: string;
  projectTypeKey: string;
  statusKey: string;
  estimatedValueKey: string;
}

interface ReportNegotiationLogRow {
  negotiationId: string;
  projectName: string;
  clientName: string;
  sellerName: string;
  date: string | null;
  description: string;
}

interface ExcelWorkbookSheet {
  name: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

type ReportFilterKey =
  | 'project'
  | 'seller'
  | 'client'
  | 'projectType'
  | 'status'
  | 'estimatedValue';

@Component({
  selector: 'app-reports',
  imports: [MaterialModule, TitleCasePipe],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  private static readonly crcTable = ReportsComponent.buildCrcTable();

  private readonly projectsService = inject(ProjectsService);
  private readonly negotiationsService = inject(NegotiationsService);

  public isLoadingData = true;
  public isGeneratingReport = false;
  public reportsError = '';

  public selectedProjectKeys: string[] = [];
  public selectedSellerKeys: string[] = [];
  public selectedClientKeys: string[] = [];
  public selectedProjectTypeKeys: string[] = [];
  public selectedStatusKeys: string[] = [];
  public selectedEstimatedValueKeys: string[] = [];

  public projectOptions: ReportOption[] = [];
  public sellerOptions: ReportOption[] = [];
  public clientOptions: ReportOption[] = [];
  public projectTypeOptions: ReportOption[] = [];
  public statusOptions: ReportOption[] = [];
  public estimatedValueOptions: ReportOption[] = [];

  public reportGenerated = false;
  public reportProjects: ProjectListItem[] = [];
  public reportNegotiations: NegotiationListItem[] = [];
  public reportLogs: ReportNegotiationLogRow[] = [];

  public displayedColumnsProjectReport: string[] = [
    'project',
    'client',
    'seller',
    'projectType',
    'status',
    'estimatedValue',
  ];
  public displayedColumnsNegotiationReport: string[] = [
    'project',
    'client',
    'createdAt',
  ];
  public displayedColumnsLogsReport: string[] = [
    'negotiationId',
    'project',
    'seller',
    'date',
    'description',
  ];

  private projectRecords: ReportProjectRecord[] = [];
  private allNegotiations: NegotiationListItem[] = [];

  public ngOnInit(): void {
    void this.loadBaseData();
  }

  public async loadBaseData(): Promise<void> {
    this.isLoadingData = true;
    this.reportsError = '';

    try {
      const [projects, negotiations] = await Promise.all([
        this.projectsService.getProjects(),
        this.negotiationsService.getNegotiations(),
      ]);

      this.projectRecords = this.buildProjectRecords(projects);
      this.allNegotiations = negotiations;

      this.recalculateFilterOptions(false);
    } catch (error) {
      console.error('Error loading report data', error);
      this.reportsError = 'No fue posible cargar la información para reportes.';
      this.projectRecords = [];
      this.allNegotiations = [];
      this.recalculateFilterOptions(false);
    } finally {
      this.isLoadingData = false;
    }
  }

  public onFiltersChanged(): void {
    this.recalculateFilterOptions(true);
    this.resetReportOutput();
  }

  public clearFilters(): void {
    this.selectedProjectKeys = [];
    this.selectedSellerKeys = [];
    this.selectedClientKeys = [];
    this.selectedProjectTypeKeys = [];
    this.selectedStatusKeys = [];
    this.selectedEstimatedValueKeys = [];

    this.recalculateFilterOptions(false);
    this.resetReportOutput();
  }

  public async generateReport(): Promise<void> {
    this.isGeneratingReport = true;
    this.reportsError = '';

    try {
      const filteredRecords = this.projectRecords.filter((record) =>
        this.matchesSelectedFilters(record),
      );

      this.reportProjects = filteredRecords.map((record) => record.project);
      this.reportNegotiations = this.filterNegotiationsByProjects(
        this.reportProjects,
      );
      this.reportLogs = await this.buildLogsReport(this.reportNegotiations);
      this.reportGenerated = true;
    } catch (error) {
      console.error('Error generating report', error);
      this.reportsError = 'No fue posible generar el reporte.';
      this.resetReportOutput();
    } finally {
      this.isGeneratingReport = false;
    }
  }

  public canDownloadReport(): boolean {
    return this.reportGenerated && this.hasAnyReportRows();
  }

  public hasSourceProjects(): boolean {
    return this.projectRecords.length > 0;
  }

  public downloadExcelReport(): void {
    if (!this.canDownloadReport()) {
      return;
    }

    const workbookBytes = this.buildWorkbookXlsx();
    const workbookBuffer = new ArrayBuffer(workbookBytes.byteLength);
    new Uint8Array(workbookBuffer).set(workbookBytes);
    const reportDate = formatDate(new Date(), 'yyyyMMdd_HHmm', 'es-CO');
    const fileName = `reporte_proyectos_${reportDate}.xlsx`;
    const fileBlob = new Blob([workbookBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const objectUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(objectUrl);
  }

  public hasAnyReportRows(): boolean {
    return (
      this.reportProjects.length > 0 ||
      this.reportNegotiations.length > 0 ||
      this.reportLogs.length > 0
    );
  }

  public formatStatusLabel(status: string): string {
    if (!status) {
      return 'Sin estado';
    }

    return status.replaceAll('_', ' ');
  }

  public formatDateLabel(value: string | null): string {
    if (!value) {
      return 'Sin fecha';
    }

    return formatDate(value, 'dd/MM/yyyy HH:mm', 'es-CO');
  }

  public formatEstimatedValue(value: string | number): string {
    const estimatedValue = this.toNumber(value);
    if (estimatedValue === null) {
      return 'Sin valor';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(estimatedValue);
  }

  private filterNegotiationsByProjects(
    projects: ProjectListItem[],
  ): NegotiationListItem[] {
    const normalizedProjectNames = new Set(
      projects.map((project) => this.normalizeText(project.name)),
    );

    if (!normalizedProjectNames.size) {
      return [];
    }

    return this.allNegotiations.filter((negotiation) =>
      normalizedProjectNames.has(this.normalizeText(negotiation.projectName)),
    );
  }

  private async buildLogsReport(
    negotiations: NegotiationListItem[],
  ): Promise<ReportNegotiationLogRow[]> {
    if (!negotiations.length) {
      return [];
    }

    const negotiationDetails = await Promise.all(
      negotiations.map(async (negotiation) => {
        const detail = await this.loadNegotiationDetailSafe(negotiation.id);
        return {
          negotiation,
          detail,
        };
      }),
    );

    const rows: ReportNegotiationLogRow[] = [];

    for (const item of negotiationDetails) {
      const negotiation = item.negotiation;
      const detail = item.detail;
      const logs = detail?.logs ?? [];

      for (const log of logs) {
        rows.push({
          negotiationId: negotiation.id,
          projectName: detail?.projectName ?? negotiation.projectName,
          clientName: detail?.clientName ?? negotiation.clientName,
          sellerName: log.sellerName,
          date: log.date,
          description: log.description,
        });
      }
    }

    rows.sort((leftRow, rightRow) => {
      const leftDate = leftRow.date ? new Date(leftRow.date).getTime() : 0;
      const rightDate = rightRow.date ? new Date(rightRow.date).getTime() : 0;
      return rightDate - leftDate;
    });

    return rows;
  }

  private async loadNegotiationDetailSafe(
    negotiationId: string,
  ): Promise<NegotiationDetail | null> {
    try {
      return await this.negotiationsService.getNegotiationById(negotiationId);
    } catch (error) {
      console.error(
        `Error loading negotiation detail for ${negotiationId}`,
        error,
      );
      return null;
    }
  }

  private recalculateFilterOptions(pruneSelectedValues: boolean): void {
    this.projectOptions = this.collectOptions('project');
    this.sellerOptions = this.collectOptions('seller');
    this.clientOptions = this.collectOptions('client');
    this.projectTypeOptions = this.collectOptions('projectType');
    this.statusOptions = this.collectOptions('status');
    this.estimatedValueOptions = this.collectOptions('estimatedValue');

    if (!pruneSelectedValues) {
      return;
    }

    this.selectedProjectKeys = this.pruneSelection(
      this.selectedProjectKeys,
      this.projectOptions,
    );
    this.selectedSellerKeys = this.pruneSelection(
      this.selectedSellerKeys,
      this.sellerOptions,
    );
    this.selectedClientKeys = this.pruneSelection(
      this.selectedClientKeys,
      this.clientOptions,
    );
    this.selectedProjectTypeKeys = this.pruneSelection(
      this.selectedProjectTypeKeys,
      this.projectTypeOptions,
    );
    this.selectedStatusKeys = this.pruneSelection(
      this.selectedStatusKeys,
      this.statusOptions,
    );
    this.selectedEstimatedValueKeys = this.pruneSelection(
      this.selectedEstimatedValueKeys,
      this.estimatedValueOptions,
    );
  }

  private collectOptions(filterKey: ReportFilterKey): ReportOption[] {
    const optionMap = new Map<string, ReportOption>();
    const matchingRecords = this.projectRecords.filter((record) =>
      this.matchesSelectedFilters(record, filterKey),
    );

    for (const record of matchingRecords) {
      const option = this.toOption(record, filterKey);
      if (!optionMap.has(option.value)) {
        optionMap.set(option.value, option);
      }
    }

    return [...optionMap.values()].sort((leftOption, rightOption) => {
      if (
        leftOption.sortNumber !== undefined &&
        rightOption.sortNumber !== undefined
      ) {
        return leftOption.sortNumber - rightOption.sortNumber;
      }

      return leftOption.label.localeCompare(rightOption.label, 'es', {
        sensitivity: 'base',
      });
    });
  }

  private toOption(
    record: ReportProjectRecord,
    filterKey: ReportFilterKey,
  ): ReportOption {
    switch (filterKey) {
      case 'project':
        return {
          value: record.projectKey,
          label: record.project.name,
        };
      case 'seller':
        return {
          value: record.sellerKey,
          label: record.project.sellerName,
        };
      case 'client':
        return {
          value: record.clientKey,
          label: record.project.clientName,
        };
      case 'projectType':
        return {
          value: record.projectTypeKey,
          label: record.project.businessTypeName,
        };
      case 'status':
        return {
          value: record.statusKey,
          label: this.formatStatusLabel(record.project.statusName),
        };
      case 'estimatedValue': {
        const estimatedValue = this.toNumber(record.project.estimatedValue);
        return {
          value: record.estimatedValueKey,
          label: this.formatEstimatedValue(record.project.estimatedValue),
          sortNumber: estimatedValue ?? Number.MAX_SAFE_INTEGER,
        };
      }
    }
  }

  private matchesSelectedFilters(
    record: ReportProjectRecord,
    skipFilter?: ReportFilterKey,
  ): boolean {
    return (
      this.matchesSingleFilter(
        this.selectedProjectKeys,
        record.projectKey,
        skipFilter === 'project',
      ) &&
      this.matchesSingleFilter(
        this.selectedSellerKeys,
        record.sellerKey,
        skipFilter === 'seller',
      ) &&
      this.matchesSingleFilter(
        this.selectedClientKeys,
        record.clientKey,
        skipFilter === 'client',
      ) &&
      this.matchesSingleFilter(
        this.selectedProjectTypeKeys,
        record.projectTypeKey,
        skipFilter === 'projectType',
      ) &&
      this.matchesSingleFilter(
        this.selectedStatusKeys,
        record.statusKey,
        skipFilter === 'status',
      ) &&
      this.matchesSingleFilter(
        this.selectedEstimatedValueKeys,
        record.estimatedValueKey,
        skipFilter === 'estimatedValue',
      )
    );
  }

  private matchesSingleFilter(
    selectedValues: string[],
    rowValue: string,
    skipValidation: boolean,
  ): boolean {
    if (skipValidation || !selectedValues.length) {
      return true;
    }

    return selectedValues.includes(rowValue);
  }

  private pruneSelection(
    selectedValues: string[],
    availableOptions: ReportOption[],
  ): string[] {
    const availableValues = new Set(
      availableOptions.map((availableOption) => availableOption.value),
    );

    return selectedValues.filter((selectedValue) =>
      availableValues.has(selectedValue),
    );
  }

  private buildProjectRecords(
    projects: ProjectListItem[],
  ): ReportProjectRecord[] {
    return projects.map((project, index) => {
      const estimatedValueNumber = this.toNumber(project.estimatedValue);

      return {
        project,
        projectKey: this.toKey(project.id, `project-${index + 1}`),
        sellerKey: this.toKey(
          project.sellerId ?? project.sellerName,
          `seller-${index + 1}`,
        ),
        clientKey: this.toKey(
          project.clientId ?? project.clientName,
          `client-${index + 1}`,
        ),
        projectTypeKey: this.toKey(
          project.businessTypeId ?? project.businessTypeName,
          `project-type-${index + 1}`,
        ),
        statusKey: this.toKey(
          project.statusId ?? project.statusCode ?? project.statusName,
          `status-${index + 1}`,
        ),
        estimatedValueKey: this.toKey(
          estimatedValueNumber ?? project.estimatedValue,
          `estimated-value-${index + 1}`,
        ),
      };
    });
  }

  private toKey(value: unknown, fallback: string): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return fallback;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);
      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }

    return null;
  }

  private normalizeText(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private resetReportOutput(): void {
    this.reportGenerated = false;
    this.reportProjects = [];
    this.reportNegotiations = [];
    this.reportLogs = [];
  }

  private buildWorkbookXlsx(): Uint8Array {
    const sheets = this.buildWorkbookSheets();
    const worksheetOverrides = sheets
      .map(
        (_sheet, index) =>
          `<Override PartName="/xl/worksheets/sheet${
            index + 1
          }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('');
    const worksheetRels = sheets
      .map(
        (_sheet, index) =>
          `<Relationship Id="rId${
            index + 1
          }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
            index + 1
          }.xml"/>`,
      )
      .join('');
    const workbookSheets = sheets
      .map(
        (sheet, index) =>
          `<sheet name="${this.escapeXml(
            this.toExcelSheetName(sheet.name),
          )}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
      )
      .join('');

    const files: Array<{ path: string; content: string }> = [
      {
        path: '[Content_Types].xml',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${worksheetOverrides}
</Types>`,
      },
      {
        path: '_rels/.rels',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
      },
      {
        path: 'xl/workbook.xml',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${workbookSheets}
  </sheets>
</workbook>`,
      },
      {
        path: 'xl/_rels/workbook.xml.rels',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${worksheetRels}
  <Relationship Id="rId${
    sheets.length + 1
  }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
      },
      {
        path: 'xl/styles.xml',
        content: `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`,
      },
    ];

    sheets.forEach((sheet, index) => {
      files.push({
        path: `xl/worksheets/sheet${index + 1}.xml`,
        content: this.buildOpenXmlWorksheet(sheet),
      });
    });

    return this.createZipArchive(files);
  }

  private buildWorkbookSheets(): ExcelWorkbookSheet[] {
    const projectRows: Array<Array<string | number>> = this.reportProjects.map(
      (project) => [
        project.name,
        project.clientName,
        project.sellerName,
        project.businessTypeName,
        this.formatStatusLabel(project.statusName),
        this.formatEstimatedValue(project.estimatedValue),
      ],
    );
    const negotiationRows: Array<Array<string | number>> =
      this.reportNegotiations.map((negotiation) => [
        negotiation.id,
        negotiation.projectName,
        negotiation.clientName,
        this.formatDateLabel(negotiation.createdAt),
      ]);
    const logsRows: Array<Array<string | number>> = this.reportLogs.map(
      (log) => [
        log.negotiationId,
        log.projectName,
        log.clientName,
        log.sellerName,
        this.formatDateLabel(log.date),
        log.description,
      ],
    );

    return [
      {
        name: 'Proyectos',
        headers: [
          'Proyecto',
          'Cliente',
          'Vendedor',
          'Tipo de proyecto',
          'Estado',
          'Valor estimado',
        ],
        rows: projectRows,
      },
      {
        name: 'Negociaciones',
        headers: ['ID', 'Proyecto', 'Cliente', 'Fecha de creacion'],
        rows: negotiationRows,
      },
      {
        name: 'Logs',
        headers: [
          'ID negociacion',
          'Proyecto',
          'Cliente',
          'Vendedor',
          'Fecha',
          'Descripcion',
        ],
        rows: logsRows,
      },
    ];
  }

  private buildOpenXmlWorksheet(sheet: ExcelWorkbookSheet): string {
    const headerCellsXml = sheet.headers
      .map((header, index) =>
        this.buildOpenXmlCell(
          `${this.getExcelColumnName(index)}1`,
          header,
          true,
        ),
      )
      .join('');
    const bodyRowsXml = sheet.rows
      .map((row, rowIndex) => {
        const rowNumber = rowIndex + 2;
        const cellsXml = row
          .map((cellValue, colIndex) =>
            this.buildOpenXmlCell(
              `${this.getExcelColumnName(colIndex)}${rowNumber}`,
              cellValue,
            ),
          )
          .join('');
        return `<row r="${rowNumber}">${cellsXml}</row>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">${headerCellsXml}</row>
    ${bodyRowsXml}
  </sheetData>
</worksheet>`;
  }

  private buildOpenXmlCell(
    reference: string,
    value: string | number,
    isHeader = false,
  ): string {
    const style = isHeader ? ' s="1"' : '';
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `<c r="${reference}"${style}><v>${value}</v></c>`;
    }

    const textValue = String(value ?? '');
    const preserveSpace = /^\s|\s$|\n/.test(textValue)
      ? ' xml:space="preserve"'
      : '';

    return `<c r="${reference}" t="inlineStr"${style}><is><t${preserveSpace}>${this.escapeXml(
      textValue,
    )}</t></is></c>`;
  }

  private createZipArchive(
    files: Array<{ path: string; content: string }>,
  ): Uint8Array {
    const encoder = new TextEncoder();
    const zipDate = this.toZipDateTime(new Date());
    const localFileParts: Uint8Array[] = [];
    const centralDirectoryParts: Uint8Array[] = [];
    let localOffset = 0;

    files.forEach((file) => {
      const pathBytes = encoder.encode(file.path);
      const contentBytes = encoder.encode(file.content);
      const crc = this.computeCrc32(contentBytes);

      const localHeader = new Uint8Array(30 + pathBytes.length);
      const localHeaderView = new DataView(localHeader.buffer);
      localHeaderView.setUint32(0, 0x04034b50, true);
      localHeaderView.setUint16(4, 20, true);
      localHeaderView.setUint16(6, 0, true);
      localHeaderView.setUint16(8, 0, true);
      localHeaderView.setUint16(10, zipDate.time, true);
      localHeaderView.setUint16(12, zipDate.date, true);
      localHeaderView.setUint32(14, crc, true);
      localHeaderView.setUint32(18, contentBytes.length, true);
      localHeaderView.setUint32(22, contentBytes.length, true);
      localHeaderView.setUint16(26, pathBytes.length, true);
      localHeaderView.setUint16(28, 0, true);
      localHeader.set(pathBytes, 30);

      const centralHeader = new Uint8Array(46 + pathBytes.length);
      const centralHeaderView = new DataView(centralHeader.buffer);
      centralHeaderView.setUint32(0, 0x02014b50, true);
      centralHeaderView.setUint16(4, 20, true);
      centralHeaderView.setUint16(6, 20, true);
      centralHeaderView.setUint16(8, 0, true);
      centralHeaderView.setUint16(10, 0, true);
      centralHeaderView.setUint16(12, zipDate.time, true);
      centralHeaderView.setUint16(14, zipDate.date, true);
      centralHeaderView.setUint32(16, crc, true);
      centralHeaderView.setUint32(20, contentBytes.length, true);
      centralHeaderView.setUint32(24, contentBytes.length, true);
      centralHeaderView.setUint16(28, pathBytes.length, true);
      centralHeaderView.setUint16(30, 0, true);
      centralHeaderView.setUint16(32, 0, true);
      centralHeaderView.setUint16(34, 0, true);
      centralHeaderView.setUint16(36, 0, true);
      centralHeaderView.setUint32(38, 0, true);
      centralHeaderView.setUint32(42, localOffset, true);
      centralHeader.set(pathBytes, 46);

      localFileParts.push(localHeader, contentBytes);
      centralDirectoryParts.push(centralHeader);

      localOffset += localHeader.length + contentBytes.length;
    });

    const centralDirectorySize = centralDirectoryParts.reduce(
      (size, part) => size + part.length,
      0,
    );
    const endOfCentralDirectory = new Uint8Array(22);
    const endOfCentralDirectoryView = new DataView(
      endOfCentralDirectory.buffer,
    );
    endOfCentralDirectoryView.setUint32(0, 0x06054b50, true);
    endOfCentralDirectoryView.setUint16(4, 0, true);
    endOfCentralDirectoryView.setUint16(6, 0, true);
    endOfCentralDirectoryView.setUint16(8, files.length, true);
    endOfCentralDirectoryView.setUint16(10, files.length, true);
    endOfCentralDirectoryView.setUint32(12, centralDirectorySize, true);
    endOfCentralDirectoryView.setUint32(16, localOffset, true);
    endOfCentralDirectoryView.setUint16(20, 0, true);

    return this.concatBytes([
      ...localFileParts,
      ...centralDirectoryParts,
      endOfCentralDirectory,
    ]);
  }

  private concatBytes(parts: Uint8Array[]): Uint8Array {
    const totalLength = parts.reduce((length, part) => length + part.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    parts.forEach((part) => {
      combined.set(part, offset);
      offset += part.length;
    });

    return combined;
  }

  private computeCrc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;

    for (const byte of bytes) {
      const tableIndex = (crc ^ byte) & 0xff;
      crc = (crc >>> 8) ^ ReportsComponent.crcTable[tableIndex];
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  private toZipDateTime(date: Date): { date: number; time: number } {
    const year = Math.max(date.getFullYear(), 1980);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = Math.floor(date.getSeconds() / 2);

    return {
      date: ((year - 1980) << 9) | (month << 5) | day,
      time: (hours << 11) | (minutes << 5) | seconds,
    };
  }

  private getExcelColumnName(columnIndex: number): string {
    let index = columnIndex;
    let columnName = '';

    while (index >= 0) {
      columnName = String.fromCharCode((index % 26) + 65) + columnName;
      index = Math.floor(index / 26) - 1;
    }

    return columnName;
  }

  private static buildCrcTable(): Uint32Array {
    const table = new Uint32Array(256);

    for (let index = 0; index < 256; index += 1) {
      let current = index;

      for (let bit = 0; bit < 8; bit += 1) {
        if ((current & 1) === 1) {
          current = 0xedb88320 ^ (current >>> 1);
        } else {
          current >>>= 1;
        }
      }

      table[index] = current >>> 0;
    }

    return table;
  }

  private toExcelSheetName(name: string): string {
    return name
      .replace(/[\\/*?:[\]]/g, ' ')
      .trim()
      .slice(0, 31);
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}
