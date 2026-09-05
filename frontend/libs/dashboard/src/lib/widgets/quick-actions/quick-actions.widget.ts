import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardStore } from '../../store/dashboard.store';
import { DashboardWidget } from '../dashboard-widget';

@Component({
  selector: 'app-quick-actions-widget',
  imports: [RouterModule, TranslatePipe, DashboardWidget],
  template: `
    <app-dashboard-widget titleKey="DASHBOARD.QUICK_ACTIONS">
      <div class="actions-grid">
        @for (action of store.quickActions(); track action.id) {
          <a class="action-btn" [routerLink]="action.route">
            <span class="action-icon-wrap">
              @switch (action.id) {
                @case ('sale') {
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                }
                @case ('purchase') {
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                }
                @case ('product') {
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                    <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon>
                    <polygon points="12 12 21 6.92 21 17.08 12 22.08"></polygon>
                    <polygon points="12 2 3 6.92 12 12 21 6.92 12 2"></polygon>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                }
                @case ('customer') {
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                }
                @case ('stock') {
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                }
                @case ('barcode') {
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 5h2v14H3zm4 0h1v14H7zm3 0h3v14h-3zm5 0h1v14h-1zm3 0h3v14h-3z"/>
                  </svg>
                }
              }
            </span>
            <span>{{ action.labelKey | translate }}</span>
          </a>
        }
      </div>
    </app-dashboard-widget>
  `,
  styles: `
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 0.65rem;
    }
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      padding: 0.75rem 0.35rem;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: var(--color-surface);
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: 0.7rem;
      font-weight: 600;
      text-align: center;
      transition: all 0.15s ease;
    }
    .action-btn:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: var(--color-primary-glow);
    }
    .action-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      transition: transform 0.2s ease;
    }
    .action-btn:hover .action-icon-wrap {
      transform: translateY(-2px);
    }
    @media (max-width: 1200px) { .actions-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) { .actions-grid { grid-template-columns: repeat(2, 1fr); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsWidget {
  protected store = inject(DashboardStore);
}
