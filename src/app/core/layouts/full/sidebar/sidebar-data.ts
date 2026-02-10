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
    iconName: 'solar:atom-line-duotone',
    route: '/projects',
  },
];
