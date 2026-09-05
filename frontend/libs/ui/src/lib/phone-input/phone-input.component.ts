import { Component, ChangeDetectionStrategy, model, input, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PhoneCountryCode {
  code: string;
  name: string;
  flag: string;
}

// Egypt is first/default per product convention — the app's primary market.
export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { code: '+20', name: 'Egypt', flag: 'https://flagcdn.com/w20/eg.png' },
  { code: '+971', name: 'UAE', flag: 'https://flagcdn.com/w20/ae.png' },
  { code: '+966', name: 'Saudi Arabia', flag: 'https://flagcdn.com/w20/sa.png' },
  { code: '+1', name: 'USA', flag: 'https://flagcdn.com/w20/us.png' },
];

export const DEFAULT_PHONE_COUNTRY_CODE = PHONE_COUNTRY_CODES[0].code;

/** Splits a stored "+20 1012345678" phone string into its country code and local number. */
export function splitPhoneNumber(phone: string | null | undefined): { code: string; number: string } {
  if (!phone) return { code: DEFAULT_PHONE_COUNTRY_CODE, number: '' };
  const match = phone.match(/^(\+\d+)\s*(.*)$/);
  if (match) return { code: match[1], number: match[2] };
  return { code: DEFAULT_PHONE_COUNTRY_CODE, number: phone };
}

/** Combines a country code and local number back into a single stored phone string. */
export function combinePhoneNumber(code: string, number: string): string {
  const trimmed = (number || '').trim();
  return trimmed ? `${code} ${trimmed}` : '';
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneInputComponent {
  code = model<string>(DEFAULT_PHONE_COUNTRY_CODE);
  number = model<string>('');
  inputId = input<string>('phone');
  placeholder = input<string>('10 123 4567');

  readonly countryCodes = PHONE_COUNTRY_CODES;
  showDropdown = signal(false);

  getSelectedFlag(): string {
    const item = this.countryCodes.find((c) => c.code === this.code());
    return item ? item.flag : this.countryCodes[0].flag;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown.update((v) => !v);
  }

  selectCode(item: PhoneCountryCode) {
    this.code.set(item.code);
    this.showDropdown.set(false);
  }

  @HostListener('document:click')
  closeDropdown() {
    this.showDropdown.set(false);
  }
}
