import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('items')
  @Permissions('Inventory.Create')
  async createItem(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const userEmail = req.user.email;
    return this.inventoryService.createItem(tenantId, userEmail, body);
  }

  @Get('items/branch/:branchId')
  @Permissions('Inventory.View')
  async getByBranch(@Request() req: any, @Param('branchId') branchId: string) {
    const tenantId = req.user.tenantId;
    return this.inventoryService.getItemsByBranch(tenantId, branchId);
  }

  @Get('items/barcode/:barcode')
  @Permissions('Inventory.View')
  async getByBarcode(
    @Request() req: any,
    @Param('barcode') barcode: string,
    @Query('goldRate') goldRate?: string,
  ) {
    const tenantId = req.user.tenantId;
    const activeRate = goldRate ? parseFloat(goldRate) : 75.0;
    return this.inventoryService.getItemByBarcode(
      tenantId,
      barcode,
      activeRate,
    );
  }

  @Put('items/:id')
  @Permissions('Inventory.Edit')
  async updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.inventoryService.updateItem(tenantId, id, body);
  }

  @Delete('items/:id')
  @Permissions('Inventory.Edit')
  async deleteItem(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.inventoryService.deleteItem(tenantId, id);
  }
}
