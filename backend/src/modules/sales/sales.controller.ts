import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('transactions')
  @Permissions('Sales.Create')
  async createTransaction(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const userEmail = req.user.email;
    return this.salesService.createTransaction(tenantId, userEmail, body);
  }

  @Get('transactions')
  @Permissions('Sales.View')
  async findAllTransactions(@Request() req: any) {
    return this.salesService.findAllTransactions(req.user.tenantId);
  }

  @Get('buybacks')
  @Permissions('Sales.View')
  async findAllBuybacks(@Request() req: any) {
    return this.salesService.findAllBuybacks(req.user.tenantId);
  }
}
