import { Injectable, signal, effect } from '@angular/core';

export interface SystemConfig {
  dollarPrice: number;
  taxRate: number;
  stampDuty: number;
  karat24: number;
  karat21: number;
  karat18: number;
  silver: number;
}

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  dollarPrice: 48.50,
  taxRate: 14.0, // 14% VAT
  stampDuty: 50.0, // 50 EGP per gram
  karat24: 3850,
  karat21: 3368,
  karat18: 2888,
  silver: 42
};

const STORAGE_KEY = 'aurum_system_config_v2';

@Injectable({
  providedIn: 'root',
})
export class SystemSettingsService {
  public config = signal<SystemConfig>(this.getStoredConfig());

  constructor() {
    effect(() => {
      const current = this.config();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    });
  }

  updateConfig(updates: Partial<SystemConfig>) {
    this.config.update((cfg) => ({ ...cfg, ...updates }));
  }

  resetConfig() {
    this.config.set({ ...DEFAULT_SYSTEM_CONFIG });
  }

  private getStoredConfig(): SystemConfig {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SYSTEM_CONFIG, ...JSON.parse(stored) };
      } catch {
        return { ...DEFAULT_SYSTEM_CONFIG };
      }
    }
    return { ...DEFAULT_SYSTEM_CONFIG };
  }
}
