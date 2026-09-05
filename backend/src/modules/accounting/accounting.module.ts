import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { SalesModule } from '../sales/sales.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { CustomersModule } from '../customers/customers.module';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
  imports: [SalesModule, PurchaseModule, CustomersModule, SuppliersModule],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
