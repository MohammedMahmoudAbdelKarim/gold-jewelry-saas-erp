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
      gap: 0.85rem;
    }
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      padding: 1rem 0.5rem;
      border-radius: var(--border-radius-md);
      border: 1px solid var(--border-color);
      background: var(--color-surface);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: 0.775rem;
      font-weight: 700;
      text-align: center;
      box-shadow: var(--box-shadow-sm);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .action-btn:hover {
      color: #F8FAFC;
      border-color: var(--color-primary);
      background: rgba(212, 175, 55, 0.1);
      transform: translateY(-3px);
      box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 0 16px rgba(212, 175, 55, 0.12);
    }
    .action-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%);
      border: 1px solid rgba(212, 175, 55, 0.3);
      color: var(--color-primary);
      transition: all 0.25s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .action-btn:hover .action-icon-wrap {
      transform: scale(1.1);
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.15) 100%);
      border-color: #D4AF37;
      color: #FFF6D6;
      box-shadow: 0 0 14px rgba(212, 175, 55, 0.3);
    }
    @media (max-width: 1200px) { .actions-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) { .actions-grid { grid-template-columns: repeat(2, 1fr); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsWidget {
  protected store = inject(DashboardStore);
}
