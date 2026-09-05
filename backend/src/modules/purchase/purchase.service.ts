import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseRepository, PurchaseOrder } from './purchase.repository';

export interface CreatePurchaseOrderDto {
  branchId: string;
  supplierId: string;
  itemDescription: string;
  goldKarat?: string;
  weightGrams: number;
  unitCostPerGram: number;
  notes?: string;
}

export interface UpdatePurchaseOrderDto {
  itemDescription?: string;
  goldKarat?: string;
  weightGrams?: number;
  unitCostPerGram?: number;
  status?: string;
  notes?: string;
}

const VALID_STATUSES = ['pending', 'received', 'cancelled'];

@Injectable()
export class PurchaseService {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async findAll(tenantId: string): Promise<PurchaseOrder[]> {
    return this.purchaseRepository.findAll(tenantId);
  }

  async findById(tenantId: string, id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseRepository.findById(id, tenantId);
    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }
    return order;
  }

  async create(tenantId: string, userId: string, dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    if (!dto.supplierId) {
      throw new BadRequestException('Supplier is required');
    }
    if (!dto.itemDescription || !dto.itemDescription.trim()) {
      throw new BadRequestException('Item description is required');
    }
    if (!dto.weightGrams || dto.weightGrams <= 0) {
      throw new BadRequestException('Weight must be greater than zero');
    }
    if (dto.unitCostPerGram === undefined || dto.unitCostPerGram < 0) {
      throw new BadRequestException('Unit cost per gram is required');
    }

    return this.purchaseRepository.create({
      tenantId,
      branchId: dto.branchId,
      supplierId: dto.supplierId,
      userId,
      itemDescription: dto.itemDescription.trim(),
      goldKarat: dto.goldKarat,
      weightGrams: dto.weightGrams,
      unitCostPerGram: dto.unitCostPerGram,
      notes: dto.notes,
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    if (dto.status !== undefined && !VALID_STATUSES.includes(dto.status)) {
      throw new BadRequestException(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    if (dto.weightGrams !== undefined && dto.weightGrams <= 0) {
      throw new BadRequestException('Weight must be greater than zero');
    }

    const updated = await this.purchaseRepository.update(id, tenantId, dto);
    if (!updated) {
      throw new NotFoundException('Purchase order not found');
    }
    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const deleted = await this.purchaseRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundException('Purchase order not found');
    }
    return true;
  }
}
