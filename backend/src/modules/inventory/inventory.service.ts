import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import {
  InventoryRepository,
  InventoryItem,
  CreateInventoryItemInput,
  QueryExecutor,
} from './inventory.repository';

export interface CreateItemDto {
  branchId: string;
  productId: string;
  barcode: string;
  grossWeight: number;
  netGoldWeight: number;
  goldKarat: string;
  makingChargeRate?: number;
  makingChargeType?: string;
  stoneCharge?: number;
  wastagePercent?: number;
}

export interface ItemPricing {
  goldRate24kUsed: number;
  karatRateApplied: number;
  purityMultiplier: number;
  wastageWeight: number;
  metalValue: number;
  makingCharge: number;
  stoneCharge: number;
  totalPrice: number;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  // Purity conversion multipliers relative to 24K (1.000)
  private getKaratMultiplier(karat: string): number {
    const rates: Record<string, number> = {
      '24K': 1.0,
      '22K': 0.9167,
      '21K': 0.875,
      '18K': 0.75,
    };
    return rates[karat.toUpperCase()] || 0.75;
  }

  async createItem(
    tenantId: string,
    userEmail: string,
    data: CreateItemDto,
  ): Promise<InventoryItem> {
    if (data.netGoldWeight > data.grossWeight) {
      throw new BadRequestException(
        'Net gold weight cannot exceed gross weight',
      );
    }

    return this.dbService.runTransaction(
      tenantId,
      userEmail,
      async (client) => {
        const input: CreateInventoryItemInput = {
          tenantId,
          branchId: data.branchId,
          productId: data.productId,
          barcode: data.barcode,
          grossWeight: data.grossWeight,
          netGoldWeight: data.netGoldWeight,
          goldKarat: data.goldKarat,
          makingChargeRate: data.makingChargeRate,
          makingChargeType: data.makingChargeType,
          stoneCharge: data.stoneCharge,
          wastagePercent: data.wastagePercent,
        };
        return this.inventoryRepository.create(input, client as QueryExecutor);
      },
    );
  }

  async getItemsByBranch(
    tenantId: string,
    branchId: string,
  ): Promise<InventoryItem[]> {
    return this.inventoryRepository.getItemsByBranch(tenantId, branchId);
  }

  async getItemByBarcode(
    tenantId: string,
    barcode: string,
    liveGold24kRate: number = 75.0,
  ): Promise<InventoryItem & { pricing: ItemPricing }> {
    const item = await this.inventoryRepository.getItemByBarcode(
      tenantId,
      barcode,
    );
    if (!item) {
      throw new NotFoundException(
        `In-stock item with barcode ${barcode} not found`,
      );
    }

    const itemPriceDetails = this.calculatePrice(item, liveGold24kRate);
    return {
      ...item,
      pricing: itemPriceDetails,
    };
  }

  // Cost break-down engine
  calculatePrice(item: InventoryItem, goldRate24k: number): ItemPricing {
    const purityMultiplier = this.getKaratMultiplier(item.gold_karat);
    const goldRateForKarat = goldRate24k * purityMultiplier;

    // Wastage Weight
    const netWeight =
      typeof item.net_gold_weight === 'string'
        ? parseFloat(item.net_gold_weight)
        : item.net_gold_weight;
    const wastagePct =
      typeof item.wastage_percent === 'string'
        ? parseFloat(item.wastage_percent) / 100
        : (item.wastage_percent || 0) / 100;
    const wastageWeight = netWeight * wastagePct;
    const totalGoldWeightWithLoss = netWeight + wastageWeight;

    // Metal Base Cost
    const metalCost = totalGoldWeightWithLoss * goldRateForKarat;

    // Making Charges
    const makingRate =
      typeof item.making_charge_rate === 'string'
        ? parseFloat(item.making_charge_rate)
        : item.making_charge_rate || 0;
    const makingCharge =
      item.making_charge_type === 'per_gram'
        ? makingRate * netWeight
        : makingRate;

    // Stone Charges
    const stoneCharge =
      typeof item.stone_charge === 'string'
        ? parseFloat(item.stone_charge)
        : item.stone_charge || 0;

    // Dynamic Retail Cost
    const retailPrice = metalCost + makingCharge + stoneCharge;

    return {
      goldRate24kUsed: goldRate24k,
      karatRateApplied: goldRateForKarat,
      purityMultiplier,
      wastageWeight,
      metalValue: parseFloat(metalCost.toFixed(2)),
      makingCharge: parseFloat(makingCharge.toFixed(2)),
      stoneCharge: parseFloat(stoneCharge.toFixed(2)),
      totalPrice: parseFloat(retailPrice.toFixed(2)),
    };
  }

  async updateItem(
    tenantId: string,
    id: string,
    data: {
      grossWeight?: number;
      netGoldWeight?: number;
      goldKarat?: string;
      makingChargeRate?: number;
      makingChargeType?: string;
      stoneCharge?: number;
      wastagePercent?: number;
      status?: string;
    },
  ): Promise<boolean> {
    if (data.netGoldWeight !== undefined && data.grossWeight !== undefined && data.netGoldWeight > data.grossWeight) {
      throw new BadRequestException(
        'Net gold weight cannot exceed gross weight',
      );
    }
    return this.inventoryRepository.update(id, tenantId, data);
  }

  async deleteItem(tenantId: string, id: string): Promise<boolean> {
    return this.inventoryRepository.delete(id, tenantId);
  }
}
