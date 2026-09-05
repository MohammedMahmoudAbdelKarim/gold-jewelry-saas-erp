import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { DatabaseService } from '../../core/database/database.service';
import { SalesRepository } from './sales.repository';
import {
  InventoryRepository,
  QueryExecutor,
} from '../inventory/inventory.repository';

describe('SalesService', () => {
  let service: SalesService;

  const mockDbService = {
    runTransaction: jest.fn(
      (
        tenantId: string,
        email: string,
        cb: (client: QueryExecutor) => unknown,
      ) => cb({ query: jest.fn() }),
    ),
  };

  const mockSalesRepository = {
    createTransaction: jest.fn().mockResolvedValue({ id: 'trans-789' }),
    createSalesItem: jest.fn().mockResolvedValue({}),
    createBuyback: jest.fn().mockResolvedValue({}),
  };

  const mockInventoryRepository = {
    updateStatusToSold: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: SalesRepository, useValue: mockSalesRepository },
        { provide: InventoryRepository, useValue: mockInventoryRepository },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should throw BadRequestException if items array is empty or missing', async () => {
      const payload = {
        branchId: 'b-1',
        userId: 'u-1',
        items: [],
      };

      await expect(
        service.createTransaction('t-1', 'user@test.com', payload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process transaction successfully and calculate receipt correctly', async () => {
      const payload = {
        branchId: 'b-1',
        customerId: 'c-1',
        userId: 'u-1',
        items: [
          {
            inventoryItemId: 'item-1',
            goldRateApplied: 75,
            metalValue: 500,
            makingCharge: 50,
            stoneCharge: 100,
            finalPrice: 650,
          },
          {
            inventoryItemId: 'item-2',
            goldRateApplied: 75,
            metalValue: 300,
            makingCharge: 30,
            stoneCharge: 0,
            finalPrice: 330,
          },
        ],
        buybacks: [
          {
            claimedKarat: '21K',
            testedPurityPercent: 87.5,
            grossWeight: 5,
            netWeight: 5,
            buybackRateApplied: 64.31,
            totalValuation: 321.55,
          },
        ],
        discountAmount: 50,
        taxAmount: 20,
      };

      const result = await service.createTransaction(
        't-1',
        'user@test.com',
        payload,
      );

      expect(result).toBeDefined();
      expect(result.transactionId).toBe('trans-789');
      expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(result.subtotal).toBe(980);
      expect(result.totalAmount).toBe(950);
      expect(result.buybackOffset).toBe(321.55);
      expect(result.netCashPaid).toBe(628.45);

      expect(mockDbService.runTransaction).toHaveBeenCalled();
      expect(mockSalesRepository.createTransaction).toHaveBeenCalled();
      expect(mockInventoryRepository.updateStatusToSold).toHaveBeenCalledTimes(
        2,
      );
      expect(mockSalesRepository.createSalesItem).toHaveBeenCalledTimes(2);
      expect(mockSalesRepository.createBuyback).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException and rollback if an inventory item is not in stock', async () => {
      mockInventoryRepository.updateStatusToSold.mockResolvedValueOnce(false);

      const payload = {
        branchId: 'b-1',
        userId: 'u-1',
        items: [
          {
            inventoryItemId: 'item-out-of-stock',
            goldRateApplied: 75,
            metalValue: 0,
            makingCharge: 0,
            stoneCharge: 0,
            finalPrice: 500,
          },
        ],
      };

      await expect(
        service.createTransaction('t-1', 'user@test.com', payload),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
