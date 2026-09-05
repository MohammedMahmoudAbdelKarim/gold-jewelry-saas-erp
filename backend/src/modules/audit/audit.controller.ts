import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditRepository: AuditRepository) {}

  @Get()
  @Permissions('Accounting.View')
  async findAll(@Request() req: any) {
    return this.auditRepository.findAll(req.user.tenantId);
  }
}
