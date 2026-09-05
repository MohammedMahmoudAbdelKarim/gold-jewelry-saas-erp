import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomersRepository, Customer } from './customers.repository';

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  goldBalanceGrams?: number;
  cashBalance?: number;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  goldBalanceGrams?: number;
  cashBalance?: number;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async findAll(tenantId: string): Promise<Customer[]> {
    return this.customersRepository.findAll(tenantId);
  }

  async findById(tenantId: string, id: string): Promise<Customer> {
    const customer = await this.customersRepository.findById(id, tenantId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(tenantId: string, dto: CreateCustomerDto): Promise<Customer> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Customer name is required');
    }
    if (dto.email && !EMAIL_PATTERN.test(dto.email)) {
      throw new BadRequestException('Invalid email address');
    }

    return this.customersRepository.create({
      tenantId,
      name: dto.name.trim(),
      phone: dto.phone,
      email: dto.email,
      idType: dto.idType,
      idNumber: dto.idNumber,
      goldBalanceGrams: dto.goldBalanceGrams,
      cashBalance: dto.cashBalance,
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto): Promise<Customer> {
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Customer name cannot be empty');
    }
    if (dto.email && !EMAIL_PATTERN.test(dto.email)) {
      throw new BadRequestException('Invalid email address');
    }

    const updated = await this.customersRepository.update(id, tenantId, {
      ...dto,
      name: dto.name?.trim(),
    });
    if (!updated) {
      throw new NotFoundException('Customer not found');
    }
    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const deleted = await this.customersRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundException('Customer not found');
    }
    return true;
  }
}
