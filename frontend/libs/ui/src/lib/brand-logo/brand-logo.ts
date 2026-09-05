import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      class="brand-logo-svg"
    >
      <defs>
        <linearGradient id="aurum-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F7E7A3" />
          <stop offset="45%" stop-color="#D4AF37" />
          <stop offset="100%" stop-color="#8B6914" />
        </linearGradient>
        <linearGradient id="aurum-shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
        </linearGradient>
        <filter id="aurum-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#D4AF37" flood-opacity="0.35" />
        </filter>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="14" fill="#000000" stroke="url(#aurum-gold)" stroke-width="1.5" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="url(#aurum-gold)" stroke-width="1.25" opacity="0.55" />
      <g filter="url(#aurum-glow)">
        <polygon points="32,12 48,32 32,52 16,32" fill="url(#aurum-gold)" />
        <polygon points="32,12 40,24 32,32 24,24" fill="url(#aurum-shine)" />
        <polygon points="32,32 48,32 32,52" fill="#000000" fill-opacity="0.18" />
      </g>
      <circle cx="32" cy="32" r="3" fill="#000000" fill-opacity="0.35" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }

    .brand-logo-svg {
      flex-shrink: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandLogo {
  size = input('44');
}
