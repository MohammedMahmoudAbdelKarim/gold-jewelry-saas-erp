import { Injectable, signal, effect, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

export type SupportedLanguage = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);
  private document = inject(DOCUMENT);

  // Core signals
  public currentLanguage = signal<SupportedLanguage>('ar');
  public direction = signal<Direction>('rtl');

  constructor() {
    this.translate.addLangs(['en', 'ar']);

    // Effect to handle language changes automatically
    effect(() => {
      const lang = this.currentLanguage();
      this.translate.use(lang);
      
      const isRtl = lang === 'ar';
      this.document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      this.document.documentElement.lang = lang;
      
      // Update typography
      const fontVar = isRtl ? 'var(--font-family-ar)' : 'var(--font-family-en)';
      this.document.documentElement.style.setProperty('--font-family-base', fontVar);
      
      this.direction.set(isRtl ? 'rtl' : 'ltr');
    });
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage.set(lang);
  }

  public toggleLanguage() {
    this.currentLanguage.set(this.currentLanguage() === 'en' ? 'ar' : 'en');
  }
}
