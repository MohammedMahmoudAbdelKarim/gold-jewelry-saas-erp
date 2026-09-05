import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { SalesRepository } from './sales.repository';
import {
  InventoryRepository,
  QueryExecutor,
} from '../inventory/inventory.repository';

export interface SalesItemDto {
  inventoryItemId: string;
  goldRateApplied: number;
  metalValue: number;
  makingCharge: number;
  stoneCharge: number;
  finalPrice: number;
}

export interface BuybackDto {
  claimedKarat: string;
  testedPurityPercent: number;
  grossWeight: number;
  netWeight: number;
  buybackRateApplied: number;
  totalValuation: number;
}

export interface CreateSalesTransactionDto {
  branchId: string;
  customerId?: string;
  userId: string;
  items: SalesItemDto[];
  buybacks?: BuybackDto[];
  discountAmount?: number;
  taxAmount?: number;
  paymentMethod?: string;
}

export interface SalesTransactionResult {
  transactionId: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  buybackOffset: number;
  netCashPaid: number;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly salesRepository: SalesRepository,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  async createTransaction(
    tenantId: string,
    userEmail: string,
    data: CreateSalesTransactionDto,
  ): Promise<SalesTransactionResult> {
    const {
      branchId,
      customerId,
      userId,
      items, // array of { inventoryItemId, goldRateApplied, metalValue, makingCharge, stoneCharge, finalPrice }
      buybacks, // array of { claimedKarat, testedPurityPercent, grossWeight, netWeight, buybackRateApplied, totalValuation }
      discountAmount = 0,
      taxAmount = 0,
    } = data;

    if (!items || items.length === 0) {
      throw new BadRequestException('At least one item must be checked out');
    }

    return this.dbService.runTransaction(
      tenantId,
      userEmail,
      async (client) => {
        // 1. Generate Invoice Number
        const invoiceSeed = Math.floor(100000 + Math.random() * 900000);
        const invoiceNumber = `INV-${new Date().getFullYear()}-${invoiceSeed}`;

        // 2. Sum up sold items
        let subtotal = 0;
        for (const item of items) {
          subtotal += parseFloat(item.finalPrice as unknown as string);
        }

        // 3. Subtract buyback totals
        let buybackTotal = 0;
        if (buybacks && buybacks.length > 0) {
          for (const bb of buybacks) {
            buybackTotal += parseFloat(bb.totalValuation as unknown as string);
          }
        }

        const totalAmount = subtotal + taxAmount - discountAmount;
        const netCashDue = totalAmount - buybackTotal;

        // 4. Insert main transaction record
        // Active gold rate reference
        const goldRate24k = items[0].goldRateApplied;

        const transResult = await this.salesRepository.createTransaction(
          {
            tenantId,
            branchId,
            customerId: customerId || null,
            userId,
            invoiceNumber,
            goldRateApplied24k: goldRate24k,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
          },
          client as QueryExecutor,
        );
        const transactionId = transResult.id;

        // 5. Insert sales items and update inventory status to 'sold'
        for (const item of items) {
          // Lock inventory item status
          const updated = await this.inventoryRepository.updateStatusToSold(
            item.inventoryItemId,
            tenantId,
            client as QueryExecutor,
          );
          if (!updated) {
            throw new BadRequestException(
              `Item with ID ${item.inventoryItemId} is not in stock or does not exist`,
            );
          }

          // Add transaction split
          await this.salesRepository.createSalesItem(
            {
              salesTransactionId: transactionId,
              inventoryItemId: item.inventoryItemId,
              goldRateApplied: item.goldRateApplied,
              metalValueCalculated: item.metalValue,
              makingChargeApplied: item.makingCharge,
              stoneChargeApplied: item.stoneCharge,
              finalItemPrice: item.finalPrice,
            },
            client as QueryExecutor,
          );
        }

        // 6. Insert direct scrap buybacks if present
        if (buybacks && buybacks.length > 0) {
          for (const bb of buybacks) {
            await this.salesRepository.createBuyback(
              {
                tenantId,
                branchId,
                customerId,
                associatedSaleId: transactionId,
                claimedKarat: bb.claimedKarat,
                testedPurityPercent: bb.testedPurityPercent,
                grossWeight: bb.grossWeight,
                netWeight: bb.netWeight,
                buybackRateApplied: bb.buybackRateApplied,
                totalValuation: bb.totalValuation,
              },
              client as QueryExecutor,
            );
          }
        }

        return {
          transactionId,
          invoiceNumber,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          buybackOffset: buybackTotal,
          netCashPaid: parseFloat(netCashDue.toFixed(2)),
        };
      },
    );
  }

  async findAllTransactions(tenantId: string) {
    return this.salesRepository.findAllTransactions(tenantId);
  }

  async findAllBuybacks(tenantId: string) {
    return this.salesRepository.findAllBuybacks(tenantId);
  }
}
