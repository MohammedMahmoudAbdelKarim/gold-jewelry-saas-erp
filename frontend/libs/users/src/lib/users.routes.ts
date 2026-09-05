import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users/users').then((m) => m.Users),
  },
  {
    path: 'new',
    loadComponent: () => import('./users/user-form').then((m) => m.UserForm),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./users/user-form').then((m) => m.UserForm),
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/roles').then((m) => m.RolesList),
  },
  {
    path: 'roles/new',
    loadComponent: () => import('./roles/role-form').then((m) => m.RoleForm),
  },
  {
    path: 'roles/edit/:id',
    loadComponent: () => import('./roles/role-form').then((m) => m.RoleForm),
  }
];
