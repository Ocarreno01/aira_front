import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Inicio',
  },
  {
    displayName: 'Dashboard',
    iconName: 'solar:atom-line-duotone',
    route: '/dashboard',
  },
  {
    navCap: 'Proyectos',
  },
  {
    displayName: 'Listado de Proyectos',
    iconName: 'solar:folder-with-files-line-duotone',
    route: '/projects/project-list',
  },
  {
    navCap: 'Negociaciones',
  },
  {
    displayName: 'Listado de negociaciones',
    iconName: 'solar:clipboard-list-line-duotone',
    route: '/projects/negotiation-list',
  },
  {
    navCap: 'Reportes',
  },
  {
    displayName: 'Reportes',
    iconName: 'solar:chart-square-line-duotone',
    route: '/projects/reports',
  },
];
