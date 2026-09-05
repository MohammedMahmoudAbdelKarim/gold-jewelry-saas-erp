import { Routes } from '@angular/router';

export const purchaseRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./purchase/purchase').then((m) => m.Purchase),
  },
  {
    path: 'new',
    loadComponent: () => import('./purchase-form/purchase-form').then((m) => m.PurchaseForm),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./purchase-form/purchase-form').then((m) => m.PurchaseForm),
  },
];
