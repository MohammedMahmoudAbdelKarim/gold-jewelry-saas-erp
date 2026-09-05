import { ChangeDetectionStrategy, Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import {
  ThemeService,
  FONT_OPTIONS_EN,
  FONT_OPTIONS_AR,
  LanguageService,
  SystemSettingsService,
} from '@frontend/core';
import { BrandLogo } from '@frontend/ui';

@Component({
  selector: 'lib-settings',
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    ButtonModule,
    InputNumberModule,
    BrandLogo
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  protected themeService = inject(ThemeService);
  protected languageService = inject(LanguageService);
  protected systemSettingsService = inject(SystemSettingsService);

  activePage = signal<'appearance' | 'system'>('appearance');

  fontEnOpen = signal(false);
  fontArOpen = signal(false);
  saved = signal(false);

  saveSettings() {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }

  protected readonly fontOptionsEn = FONT_OPTIONS_EN;
  protected readonly fontOptionsAr = FONT_OPTIONS_AR;

  @HostListener('document:click')
  closeDropdowns() {
    this.fontEnOpen.set(false);
    this.fontArOpen.set(false);
  }

  toggleFontEn(event: Event) {
    event.stopPropagation();
    this.fontEnOpen.update((open) => !open);
    this.fontArOpen.set(false);
  }

  toggleFontAr(event: Event) {
    event.stopPropagation();
    this.fontArOpen.update((open) => !open);
    this.fontEnOpen.set(false);
  }

  selectFontEn(value: string) {
    this.themeService.updateFontFamilyEn(value);
    this.fontEnOpen.set(false);
  }

  selectFontAr(value: string) {
    this.themeService.updateFontFamilyAr(value);
    this.fontArOpen.set(false);
  }

  getFontLabelEn(value: string): string {
    return this.fontOptionsEn.find((f) => f.value === value)?.label || value;
  }

  getFontLabelAr(value: string): string {
    return this.fontOptionsAr.find((f) => f.value === value)?.label || value;
  }

  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.themeService.updateLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.themeService.updateLogoUrl(null);
  }

  resetSettings() {
    this.themeService.resetTheme();
    this.systemSettingsService.resetConfig();
  }
}
