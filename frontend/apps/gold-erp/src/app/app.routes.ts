import { Route } from '@angular/router';
import { authGuard } from '@frontend/auth';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('@frontend/auth').then((m) => m.Auth),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        data: { breadcrumbKey: 'NAV.DASHBOARD', requiredPermission: 'Dashboard.View' },
        loadComponent: () => import('@frontend/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'pos',
        data: { breadcrumbKey: 'NAV.POS', requiredPermission: 'Sales.Create' },
        loadComponent: () => import('@frontend/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'inventory',
        data: { breadcrumbKey: 'NAV.INVENTORY', requiredPermission: 'Inventory.View' },
        loadChildren: () => import('@frontend/inventory').then((m) => m.inventoryRoutes),
      },
      {
        path: 'sales',
        data: { breadcrumbKey: 'NAV.SALES', requiredPermission: 'Sales.View' },
        loadComponent: () => import('@frontend/sales').then((m) => m.Sales),
      },
      {
        path: 'purchase',
        data: { breadcrumbKey: 'NAV.PURCHASE', requiredPermission: 'Purchases.View' },
        loadChildren: () => import('@frontend/purchase').then((m) => m.purchaseRoutes),
      },
      {
        path: 'customers',
        data: { breadcrumbKey: 'NAV.CUSTOMERS', requiredPermission: 'Customers.View' },
        loadChildren: () => import('@frontend/customers').then((m) => m.customersRoutes),
      },
      {
        path: 'suppliers',
        data: { breadcrumbKey: 'NAV.SUPPLIERS', requiredPermission: 'Purchases.View' },
        loadChildren: () => import('@frontend/suppliers').then((m) => m.suppliersRoutes),
      },
      {
        path: 'reports',
        data: { breadcrumbKey: 'NAV.REPORTS', requiredPermission: 'Reports.View' },
        loadComponent: () => import('@frontend/reports').then((m) => m.Reports),
      },
      {
        path: 'accounting',
        data: { breadcrumbKey: 'NAV.ACCOUNTING', requiredPermission: 'Accounting.View' },
        loadComponent: () => import('@frontend/accounting').then((m) => m.Accounting),
      },
      {
        path: 'notifications',
        data: { breadcrumbKey: 'NAV.NOTIFICATIONS' },
        loadComponent: () => import('@frontend/notifications').then((m) => m.Notifications),
      },
      {
        path: 'audit',
        data: { breadcrumbKey: 'NAV.AUDIT', requiredPermission: 'Accounting.View' },
        loadComponent: () => import('@frontend/audit').then((m) => m.Audit),
      },
      {
        path: 'profile',
        data: { breadcrumbKey: 'NAV.PROFILE' },
        loadComponent: () => import('@frontend/profile').then((m) => m.Profile),
      },
      {
        path: 'users',
        data: { breadcrumbKey: 'NAV.USERS', requiredPermission: 'Users.Manage' },
        loadChildren: () => import('@frontend/users').then((m) => m.usersRoutes),
      },
      {
        path: 'stores',
        data: { breadcrumbKey: 'NAV.STORES', requiredPermission: 'Users.Manage' },
        loadChildren: () => import('@frontend/stores').then((m) => m.storesRoutes),
      },
      {
        path: 'settings',
        data: { breadcrumbKey: 'NAV.SETTINGS', requiredPermission: 'Settings.Manage' },
        loadComponent: () => import('@frontend/settings').then((m) => m.Settings),
      },
    ],
  },
];
