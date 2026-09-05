import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('overview')
  @Permissions('Accounting.View')
  async getOverview(@Request() req: any) {
    return this.accountingService.getOverview(req.user.tenantId);
  }

  @Get('ledger')
  @Permissions('Accounting.View')
  async getLedger(@Request() req: any) {
    return this.accountingService.getLedger(req.user.tenantId);
  }
}
