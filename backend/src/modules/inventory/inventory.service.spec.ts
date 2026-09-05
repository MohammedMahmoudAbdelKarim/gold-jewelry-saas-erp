import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { DatabaseService } from '../../core/database/database.service';
import {
  InventoryRepository,
  InventoryItem,
  QueryExecutor,
} from './inventory.repository';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockDbService = {
    runTransaction: jest.fn(
      (
        tenantId: string,
        email: string,
        cb: (client: QueryExecutor) => unknown,
      ) => {
        return cb({ query: jest.fn() });
      },
    ),
  };

  const mockInventoryRepository = {
    create: jest.fn().mockResolvedValue({ id: 'item-123', status: 'in_stock' }),
    getItemsByBranch: jest.fn(),
    getItemByBarcode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: InventoryRepository, useValue: mockInventoryRepository },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createItem', () => {
    it('should throw BadRequestException if net gold weight exceeds gross weight', async () => {
      const payload = {
        branchId: 'b-1',
        productId: 'p-1',
        barcode: 'BAR-1',
        grossWeight: 10,
        netGoldWeight: 12,
        goldKarat: '21K',
      };

      await expect(
        service.createItem('t-1', 'user@test.com', payload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should insert and return inventory item on valid payload', async () => {
      const payload = {
        branchId: 'b-1',
        productId: 'p-1',
        barcode: 'BAR-1',
        grossWeight: 10,
        netGoldWeight: 9,
        goldKarat: '21K',
        makingChargeRate: 5,
        makingChargeType: 'per_gram',
        stoneCharge: 50,
        wastagePercent: 2,
      };

      const result = await service.createItem('t-1', 'user@test.com', payload);
      expect(result).toBeDefined();
      expect(result.id).toBe('item-123');
      expect(mockDbService.runTransaction).toHaveBeenCalled();
      expect(mockInventoryRepository.create).toHaveBeenCalled();
    });
  });

  describe('calculatePrice', () => {
    it('should calculate the dynamic jewelry retail price correctly for per_gram making charges', () => {
      const mockItem = {
        gold_karat: '21K',
        net_gold_weight: '10',
        wastage_percent: '5',
        making_charge_rate: '12',
        making_charge_type: 'per_gram',
        stone_charge: '150',
      };

      const liveRate24k = 75; // $75/g

      // Purity ratio for 21K = 0.875
      // Applied karat rate = 75 * 0.875 = 65.625
      // Wastage weight = 10g * 0.05 = 0.5g
      // Total weight = 10.5g
      // Metal cost = 10.5g * 65.625 = 689.0625
      // Making charge = 10g * 12 = 120
      // Stone charge = 150
      // Total = 689.0625 + 120 + 150 = 959.0625 -> Rounded to 959.06

      const pricing = service.calculatePrice(
        mockItem as unknown as InventoryItem,
        liveRate24k,
      );

      expect(pricing.karatRateApplied).toBe(65.625);
      expect(pricing.wastageWeight).toBe(0.5);
      expect(pricing.metalValue).toBe(689.06);
      expect(pricing.makingCharge).toBe(120);
      expect(pricing.stoneCharge).toBe(150);
      expect(pricing.totalPrice).toBe(959.06);
    });

    it('should calculate the dynamic jewelry retail price correctly for flat making charges', () => {
      const mockItem = {
        gold_karat: '18K',
        net_gold_weight: '8',
        wastage_percent: '10',
        making_charge_rate: '200',
        making_charge_type: 'fixed',
        stone_charge: '500',
      };

      const liveRate24k = 80; // $80/g

      // Purity ratio for 18K = 0.75
      // Applied karat rate = 80 * 0.75 = 60
      // Wastage weight = 8g * 0.10 = 0.8g
      // Total weight = 8.8g
      // Metal cost = 8.8g * 60 = 528
      // Making charge = 200 (fixed)
      // Stone charge = 500
      // Total = 528 + 200 + 500 = 1228

      const pricing = service.calculatePrice(
        mockItem as unknown as InventoryItem,
        liveRate24k,
      );

      expect(pricing.karatRateApplied).toBe(60);
      expect(pricing.wastageWeight).toBe(0.8);
      expect(pricing.metalValue).toBe(528);
      expect(pricing.makingCharge).toBe(200);
      expect(pricing.stoneCharge).toBe(500);
      expect(pricing.totalPrice).toBe(1228);
    });
  });

  describe('getItemByBarcode', () => {
    it('should throw NotFoundException if item is not found or not in stock', async () => {
      mockInventoryRepository.getItemByBarcode.mockResolvedValueOnce(null);

      await expect(
        service.getItemByBarcode('t-1', 'BAR-INVALID'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fetch in-stock item and append pricing calculations', async () => {
      mockInventoryRepository.getItemByBarcode.mockResolvedValueOnce({
        id: 'item-1',
        gold_karat: '24K',
        net_gold_weight: '5',
        wastage_percent: '0',
        making_charge_rate: '0',
        making_charge_type: 'fixed',
        stone_charge: '0',
        status: 'in_stock',
      });

      const result = await service.getItemByBarcode('t-1', 'BAR-1', 100);
      expect(result).toBeDefined();
      expect(result.id).toBe('item-1');
      expect(result.pricing.totalPrice).toBe(500); // 5g * $100/g = $500
    });
  });
});
