import { Injectable, signal } from '@angular/core';
import { GoldDetails, DiamondDetails } from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class ValuationService {
  // In a real app, this would be updated via SignalR or periodic polling
  public currentGoldRatePerGram24k = signal<number>(85.50); // Mock: $85.50/gram for 24k

  calculateGoldValue(details: GoldDetails): number {
    const rate24k = this.currentGoldRatePerGram24k();
    // Convert current karat rate
    const rateForKarat = (rate24k * details.karat) / 24;
    
    // Value = (Weight * Rate) + Workmanship
    return (details.weightGrams * rateForKarat) + details.workmanshipPrice;
  }

  calculateDiamondValue(details: DiamondDetails): number {
    // Highly simplified mock logic for diamond valuation
    let basePrice = details.caratWeight * 2000; // Base $2k per carat
    if (details.cut === 'Excellent') basePrice *= 1.2;
    if (details.clarity === 'VVS1') basePrice *= 1.5;
    return basePrice;
  }

  calculateTotalItemValue(gold?: GoldDetails, diamond?: DiamondDetails): number {
    let total = 0;
    if (gold) total += this.calculateGoldValue(gold);
    if (diamond) total += this.calculateDiamondValue(diamond);
    return total;
  }
}
