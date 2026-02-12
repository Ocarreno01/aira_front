import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'solar:atom-line-duotone',
    route: '/dashboard',
  },

  {
    displayName: 'Template Dashboard',
    iconName: 'solar:atom-line-duotone',
    route: '/template/dashboard-template',
  },

  {
    navCap: 'Ui Components',
  },
  {
    displayName: 'Badge',
    iconName: 'solar:archive-minimalistic-line-duotone',
    route: '/template/ui-components-template/badge',
  },
  {
    displayName: 'Chips',
    iconName: 'solar:danger-circle-line-duotone',
    route: '/template/ui-components-template/chips',
  },
  {
    displayName: 'Lists',
    iconName: 'solar:bookmark-square-minimalistic-line-duotone',
    route: '/template/ui-components-template/lists',
  },
  {
    displayName: 'Menu',
    iconName: 'solar:file-text-line-duotone',
    route: '/template/ui-components-template/menu',
  },
  {
    displayName: 'Tooltips',
    iconName: 'solar:text-field-focus-line-duotone',
    route: '/template/ui-components-template/tooltips',
  },

  {
    navCap: 'Pages',
  },
  {
    displayName: 'Forms',
    iconName: 'solar:file-text-line-duotone',
    route: '/template/ui-components-template/forms',
  },
  {
    displayName: 'Tables',
    iconName: 'solar:tablet-line-duotone',
    route: '/template/ui-components-template/tables',
  },

  {
    navCap: 'Extra',
  },
  {
    displayName: 'Icons',
    iconName: 'solar:sticker-smile-circle-2-line-duotone',
    route: '/template/extra-template/icons',
  },
  {
    displayName: 'Sample Page',
    iconName: 'solar:planet-3-line-duotone',
    route: '/template/extra-template/sample-page',
  },

  {
    navCap: 'Auth',
  },
  {
    displayName: 'Login',
    iconName: 'solar:login-2-linear',
    route: 'authentication',
    children: [
      {
        displayName: 'Boxed Login',
        iconName: 'tabler:point',
        route: '/authentication/login',
      },
    ],
  },
  {
    displayName: 'Register',
    iconName: 'solar:user-plus-linear',
    route: 'authentication',
    children: [
      {
        displayName: 'Boxed Register',
        iconName: 'tabler:point',
        route: '/authentication/register',
      },
    ],
  },
];
