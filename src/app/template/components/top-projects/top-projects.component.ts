import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/core/material.module';

export interface projectsData {
  id: number;
  uname: string;
  position: string;
  productName: string;
  budget: number;
  priority: string;
}

const ELEMENT_DATA: projectsData[] = [
  {
    id: 1,
    uname: 'Sunil Joshi',
    position: 'Diseñador web',
    productName: 'Elite Admin',
    budget: 3.9,
    priority: 'low',
  },
  {
    id: 2,
    uname: 'Andrew McDownland',
    position: 'Gerente de proyecto',
    productName: 'Real Homes Theme',
    budget: 24.5,
    priority: 'medium',
  },
  {
    id: 3,
    uname: 'Christopher Jamil',
    position: 'Gerente de proyecto',
    productName: 'MedicalPro Theme',
    budget: 12.8,
    priority: 'high',
  },
  {
    id: 4,
    uname: 'Nirav Joshi',
    position: 'Ingeniero frontend',
    productName: 'Hosting Press HTML',
    budget: 2.4,
    priority: 'critical',
  },
  {
    id: 5,
    uname: 'Micheal Doe',
    position: 'Redactor de contenido',
    productName: 'Helping Hands WP Theme',
    budget: 9.3,
    priority: 'low',
  },
];

@Component({
  selector: 'app-top-projects',
  imports: [MaterialModule, CommonModule],
  templateUrl: './top-projects.component.html',
})
export class AppTopProjectsComponent {
  displayedColumns: string[] = ['id', 'assigned', 'name', 'priority', 'budget'];
  dataSource = ELEMENT_DATA;
}
