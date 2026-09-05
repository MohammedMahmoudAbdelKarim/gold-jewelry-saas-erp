import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SuppliersRepository, Supplier } from './suppliers.repository';

export interface CreateSupplierDto {
  companyName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  goldReceivableGrams?: number;
  cashPayable?: number;
}

export interface UpdateSupplierDto {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  goldReceivableGrams?: number;
  cashPayable?: number;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  async findAll(tenantId: string): Promise<Supplier[]> {
    return this.suppliersRepository.findAll(tenantId);
  }

  async findById(tenantId: string, id: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findById(id, tenantId);
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async create(tenantId: string, dto: CreateSupplierDto): Promise<Supplier> {
    if (!dto.companyName || !dto.companyName.trim()) {
      throw new BadRequestException('Supplier company name is required');
    }
    if (dto.email && !EMAIL_PATTERN.test(dto.email)) {
      throw new BadRequestException('Invalid email address');
    }

    return this.suppliersRepository.create({
      tenantId,
      companyName: dto.companyName.trim(),
      contactName: dto.contactName,
      phone: dto.phone,
      email: dto.email,
      goldReceivableGrams: dto.goldReceivableGrams,
      cashPayable: dto.cashPayable,
    });
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    if (dto.companyName !== undefined && !dto.companyName.trim()) {
      throw new BadRequestException('Supplier company name cannot be empty');
    }
    if (dto.email && !EMAIL_PATTERN.test(dto.email)) {
      throw new BadRequestException('Invalid email address');
    }

    const updated = await this.suppliersRepository.update(id, tenantId, {
      ...dto,
      companyName: dto.companyName?.trim(),
    });
    if (!updated) {
      throw new NotFoundException('Supplier not found');
    }
    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const deleted = await this.suppliersRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundException('Supplier not found');
    }
    return true;
  }
}
