import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchase-orders')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  @Permissions('Purchases.View')
  async findAll(@Request() req: any) {
    return this.purchaseService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Permissions('Purchases.View')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.purchaseService.findById(req.user.tenantId, id);
  }

  @Post()
  @Permissions('Purchases.Create')
  async create(@Request() req: any, @Body() body: any) {
    return this.purchaseService.create(req.user.tenantId, req.user.sub, {
      ...body,
      branchId: req.user.branchId,
    });
  }

  @Put(':id')
  @Permissions('Purchases.Edit')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.purchaseService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  @Permissions('Purchases.Edit')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.purchaseService.delete(req.user.tenantId, id);
  }
}
