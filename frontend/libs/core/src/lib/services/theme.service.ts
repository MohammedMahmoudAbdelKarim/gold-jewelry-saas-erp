import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface FontOption {
  label: string;
  value: string;
  google: string;
}

export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  fontFamilyEn: string;
  fontFamilyAr: string;
}

export const FONT_OPTIONS_EN: FontOption[] = [
  { label: 'Outfit (Luxury)', value: 'Outfit', google: 'Outfit:wght@300;400;500;600;700;800' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans', google: 'Plus+Jakarta+Sans:wght@300;400;500;600;700;800' },
  { label: 'Inter', value: 'Inter', google: 'Inter:wght@300;400;500;600;700' },
  { label: 'Poppins', value: 'Poppins', google: 'Poppins:wght@300;400;500;600;700' },
  { label: 'Montserrat', value: 'Montserrat', google: 'Montserrat:wght@300;400;500;600;700' },
  { label: 'Dubai', value: 'Dubai', google: '' },
];

export const FONT_OPTIONS_AR: FontOption[] = [
  { label: 'Cairo (Modern)', value: 'Cairo', google: 'Cairo:wght@300;400;500;600;700;800' },
  { label: 'Tajawal', value: 'Tajawal', google: 'Tajawal:wght@300;400;500;600;700;800' },
  { label: 'Almarai', value: 'Almarai', google: 'Almarai:wght@300;400;700;800' },
  { label: 'Noto Sans Arabic', value: 'Noto Sans Arabic', google: 'Noto+Sans+Arabic:wght@300;400;500;600;700' },
  { label: 'Dubai', value: 'Dubai', google: '' },
];

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#D4AF37',
  backgroundColor: '#090B10',
  logoUrl: null,
  fontFamilyEn: 'Outfit',
  fontFamilyAr: 'Cairo',
};

const STORAGE_KEY = 'aurum_theme_config_v3';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);

  public currentTheme = signal<ThemeConfig>(this.getStoredTheme());

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.storeTheme(theme);
    });
  }

  updatePrimaryColor(color: string) {
    this.currentTheme.update((theme) => ({ ...theme, primaryColor: color }));
  }

  updateBackgroundColor(color: string) {
    this.currentTheme.update((theme) => ({ ...theme, backgroundColor: color }));
  }

  updateLogoUrl(url: string | null) {
    this.currentTheme.update((theme) => ({ ...theme, logoUrl: url }));
  }

  updateFontFamilyEn(font: string) {
    this.currentTheme.update((theme) => ({ ...theme, fontFamilyEn: font }));
  }

  updateFontFamilyAr(font: string) {
    this.currentTheme.update((theme) => ({ ...theme, fontFamilyAr: font }));
  }

  resetTheme() {
    this.currentTheme.set({ ...DEFAULT_THEME });
  }

  private isLightColor(hex: string): boolean {
    const color = hex.replace('#', '');
    if (color.length === 3) {
      const r = parseInt(color.substring(0, 1), 16) * 17;
      const g = parseInt(color.substring(1, 2), 16) * 17;
      const b = parseInt(color.substring(2, 3), 16) * 17;
      return (r * 299 + g * 587 + b * 114) / 1000 > 140;
    }
    if (color.length === 6) {
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 140;
    }
    return false;
  }

  private applyTheme(theme: ThemeConfig) {
    const root = this.document.documentElement;
    const isLight = this.isLightColor(theme.backgroundColor);

    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-bg', theme.backgroundColor);

    if (isLight) {
      // Light Luxury (Champagne & Silk)
      root.style.setProperty('--color-surface', '#ffffff');
      root.style.setProperty('--color-surface-hover', '#f8fafc');
      root.style.setProperty('--color-surface-card', '#ffffff');
      root.style.setProperty('--color-text', '#0f172a');
      root.style.setProperty('--color-text-muted', '#64748b');
      root.style.setProperty('--border-color', 'rgba(212, 175, 55, 0.2)');
      root.style.setProperty('--border-color-hover', 'rgba(212, 175, 55, 0.45)');
      root.style.setProperty('--color-primary-glow', 'rgba(212, 175, 55, 0.12)');
      root.style.setProperty('--box-shadow-premium', '0 12px 32px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(212, 175, 55, 0.04)');
    } else {
      // Dark Luxury (Obsidian & Radiant Gold)
      root.style.setProperty('--color-surface', 'rgba(15, 18, 26, 0.82)');
      root.style.setProperty('--color-surface-hover', 'rgba(25, 30, 44, 0.9)');
      root.style.setProperty('--color-surface-card', 'linear-gradient(145deg, rgba(18, 23, 33, 0.85) 0%, rgba(10, 13, 19, 0.95) 100%)');
      root.style.setProperty('--color-text', '#f8fafc');
      root.style.setProperty('--color-text-muted', '#94a3b8');
      root.style.setProperty('--border-color', 'rgba(212, 175, 55, 0.14)');
      root.style.setProperty('--border-color-hover', 'rgba(212, 175, 55, 0.38)');
      root.style.setProperty('--color-primary-glow', 'rgba(212, 175, 55, 0.18)');
      root.style.setProperty('--box-shadow-premium', '0 16px 40px -8px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.05)');
    }

    const enStack = `'${theme.fontFamilyEn}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
    const arStack = `'${theme.fontFamilyAr}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
    root.style.setProperty('--font-family-en', enStack);
    root.style.setProperty('--font-family-ar', arStack);

    this.loadGoogleFonts([theme.fontFamilyEn, theme.fontFamilyAr]);
  }

  private loadGoogleFonts(fontNames: string[]) {
    const allOptions = [...FONT_OPTIONS_EN, ...FONT_OPTIONS_AR];
    const families = [...new Set(fontNames)]
      .map((name) => allOptions.find((o) => o.value === name)?.google)
      .filter((g): g is string => !!g);

    if (!families.length) return;

    const id = 'aurum-dynamic-fonts';
    let link = this.document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      this.document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
  }

  private storeTheme(theme: ThemeConfig) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }

  private getStoredTheme(): ThemeConfig {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_THEME, ...JSON.parse(stored) };
      } catch {
        return { ...DEFAULT_THEME };
      }
    }
    return { ...DEFAULT_THEME };
  }
}
