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
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Permissions('Purchases.View')
  async findAll(@Request() req: any) {
    return this.suppliersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Permissions('Purchases.View')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.suppliersService.findById(req.user.tenantId, id);
  }

  @Post()
  @Permissions('Purchases.Create')
  async create(@Request() req: any, @Body() body: any) {
    return this.suppliersService.create(req.user.tenantId, body);
  }

  @Put(':id')
  @Permissions('Purchases.Edit')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.suppliersService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  @Permissions('Purchases.Edit')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.suppliersService.delete(req.user.tenantId, id);
  }
}
