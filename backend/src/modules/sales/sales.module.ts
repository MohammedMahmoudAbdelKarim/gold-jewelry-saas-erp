import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SalesRepository } from './sales.repository';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  providers: [SalesService, SalesRepository],
  controllers: [SalesController],
  exports: [SalesService, SalesRepository],
})
export class SalesModule {}
