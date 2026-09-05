import { Routes } from '@angular/router';

export const customersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./customers/customers').then((m) => m.Customers),
  },
  {
    path: 'new',
    loadComponent: () => import('./customer-form/customer-form').then((m) => m.CustomerForm),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./customer-form/customer-form').then((m) => m.CustomerForm),
  },
];
