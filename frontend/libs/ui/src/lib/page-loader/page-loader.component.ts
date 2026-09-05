import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '@frontend/core';

@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-loader" [style.min-height]="minHeight()">
      <div class="loader-content">
        <i class="pi pi-spin pi-spinner loader-icon"></i>
        <span class="loader-text">{{ message() || defaultMessage() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .page-loader {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: var(--color-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--box-shadow-premium);
      animation: loaderFadeIn 0.3s ease-out;
    }

    .loader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loader-icon {
      font-size: 2rem;
      color: var(--color-primary);
    }

    .loader-text {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    @keyframes loaderFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLoaderComponent {
  private languageService = inject(LanguageService);

  message = input<string>('');
  minHeight = input<string>('400px');

  defaultMessage() {
    return this.languageService.currentLanguage() === 'ar'
      ? 'جاري التحميل...'
      : 'Loading...';
  }
}
