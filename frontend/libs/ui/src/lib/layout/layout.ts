import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ChildrenOutletContexts, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Topbar } from '../topbar/topbar';
import { Sidebar } from '../sidebar/sidebar';
import { LayoutService } from '../services/layout.service';
import { routeAnimations } from '../animations/route-animations';
import { LanguageService, LoadingService } from '@frontend/core';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterModule, Topbar, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  animations: [routeAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  public layoutService = inject(LayoutService);
  protected languageService = inject(LanguageService);
  protected loadingService = inject(LoadingService);
  private contexts = inject(ChildrenOutletContexts);
  private router = inject(Router);

  // The login screen is unauthenticated and must never show the app chrome
  // (sidebar nav, live gold-rate topbar, etc.) that assumes a signed-in session.
  protected isBareLayout = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.startsWith('/login')),
      startWith(this.router.url.startsWith('/login')),
    ),
    { initialValue: this.router.url.startsWith('/login') },
  );

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.url?.join('') || 'root';
  }
}
