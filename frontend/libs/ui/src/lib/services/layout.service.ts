import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  public sidebarCollapsed = signal(false);
  public sidebarOpen = signal(false);

  toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.sidebarOpen.update((v) => !v);
      return;
    }
    this.sidebarCollapsed.update((v) => !v);
  }

  closeMobileSidebar() {
    this.sidebarOpen.set(false);
  }
}
