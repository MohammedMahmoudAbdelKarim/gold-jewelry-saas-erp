import { Routes } from '@angular/router';
import { canManageInventory } from './guards/inventory.guard';

export const inventoryRoutes: Routes = [
  {
    path: '',
    data: { breadcrumbKey: 'NAV.INVENTORY_OVERVIEW' },
    loadComponent: () =>
      import('./inventory-dashboard/inventory-dashboard.component').then(
        (m) => m.InventoryDashboardComponent
      ),
  },
  {
    path: 'items',
    data: { breadcrumbKey: 'NAV.INVENTORY_ITEMS' },
    loadComponent: () =>
      import('./items-table/items-table.component').then((m) => m.ItemsTableComponent),
  },
  {
    path: 'items/new',
    data: { breadcrumbKey: 'NAV.INVENTORY_NEW_ITEM' },
    canActivate: [canManageInventory],
    loadComponent: () =>
      import('./item-create/item-create.component').then((m) => m.ItemCreateComponent),
  },
  {
    path: 'items/edit/:id',
    data: { breadcrumbKey: 'NAV.INVENTORY_EDIT_ITEM' },
    canActivate: [canManageInventory],
    loadComponent: () =>
      import('./item-create/item-create.component').then((m) => m.ItemCreateComponent),
  },
];
