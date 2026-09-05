import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Permissions('Reports.View')
  async getSummary(@Request() req: any) {
    return this.reportsService.getSummary(req.user.tenantId);
  }

  @Get('recent-sales')
  @Permissions('Reports.View')
  async getRecentSales(@Request() req: any, @Query('limit') limit?: string) {
    return this.reportsService.getRecentSales(req.user.tenantId, limit ? parseInt(limit, 10) : 10);
  }
}
