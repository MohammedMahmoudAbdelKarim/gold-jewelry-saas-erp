import { Injectable, inject, signal, effect } from '@angular/core';
import { NavigationEnd, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { LanguageService } from '../services/language.service';

export interface BreadcrumbItem {
  label: string;
  url: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.refresh());

    effect(() => {
      this.languageService.currentLanguage();
      this.refresh();
    });

    this.refresh();
  }

  private refresh() {
    const currentUrl = this.router.url.split('?')[0];
    if (currentUrl === '/' || currentUrl === '/pos') {
      this.breadcrumbs.set([]);
      return;
    }
    const items = this.collectBreadcrumbs(this.router.routerState.snapshot.root);
    this.breadcrumbs.set(items);
  }

  private collectBreadcrumbs(
    route: ActivatedRouteSnapshot,
    url = '',
    items: { labelKey: string; url: string }[] = []
  ): BreadcrumbItem[] {
    const path = route.url.map((segment) => segment.path).join('/');
    const nextUrl = path ? `${url}/${path}` : url;
    const labelKey = route.data['breadcrumbKey'] as string | undefined;

    if (labelKey) {
      items.push({ labelKey, url: nextUrl || '/' });
    }

    for (const child of route.children) {
      this.collectBreadcrumbs(child, nextUrl, items);
    }

    if (!items.length) {
      return [];
    }

    return items.map((item, index) => ({
      label: this.translate.instant(item.labelKey),
      url: index === items.length - 1 ? null : item.url,
    }));
  }
}
