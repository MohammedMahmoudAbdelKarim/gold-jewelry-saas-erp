import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SalesModule } from '../sales/sales.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { PurchaseModule } from '../purchase/purchase.module';

@Module({
  imports: [SalesModule, InventoryModule, CustomersModule, SuppliersModule, PurchaseModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
