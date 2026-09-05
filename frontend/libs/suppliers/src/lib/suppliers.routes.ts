import { Routes } from '@angular/router';

export const suppliersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./suppliers/suppliers').then((m) => m.Suppliers),
  },
  {
    path: 'new',
    loadComponent: () => import('./supplier-form/supplier-form').then((m) => m.SupplierForm),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./supplier-form/supplier-form').then((m) => m.SupplierForm),
  },
];
