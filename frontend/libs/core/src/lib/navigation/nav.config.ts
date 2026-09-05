export interface NavItem {
  labelKey: string;
  icon: string;
  route: string;
  exact?: boolean;
  requiredPermission?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { labelKey: 'NAV.DASHBOARD', icon: 'pi-home', route: '/', exact: true, requiredPermission: 'Dashboard.View' },
  { labelKey: 'NAV.INVENTORY', icon: 'pi-box', route: '/inventory', requiredPermission: 'Inventory.View' },
  { labelKey: 'NAV.STORES', icon: 'pi-map-marker', route: '/stores', requiredPermission: 'Users.Manage' },
  { labelKey: 'NAV.SALES', icon: 'pi-shopping-cart', route: '/sales', requiredPermission: 'Sales.View' },
  { labelKey: 'NAV.PURCHASE', icon: 'pi-shopping-bag', route: '/purchase', requiredPermission: 'Purchases.View' },
  { labelKey: 'NAV.CUSTOMERS', icon: 'pi-users', route: '/customers', requiredPermission: 'Customers.View' },
  { labelKey: 'NAV.SUPPLIERS', icon: 'pi-truck', route: '/suppliers', requiredPermission: 'Purchases.View' },
  { labelKey: 'NAV.ACCOUNTING', icon: 'pi-wallet', route: '/accounting', requiredPermission: 'Accounting.View' },
  { labelKey: 'NAV.REPORTS', icon: 'pi-chart-bar', route: '/reports', requiredPermission: 'Reports.View' },
  { labelKey: 'NAV.USERS', icon: 'pi-id-card', route: '/users', requiredPermission: 'Users.Manage' },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { labelKey: 'NAV.SETTINGS', icon: 'pi-cog', route: '/settings', requiredPermission: 'Settings.Manage' },
];
