import { Routes } from '@angular/router';

export const storesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./stores/stores').then((m) => m.Stores),
  },
  {
    path: 'new',
    loadComponent: () => import('./store-form/store-form').then((m) => m.StoreForm),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./store-form/store-form').then((m) => m.StoreForm),
  }
];
