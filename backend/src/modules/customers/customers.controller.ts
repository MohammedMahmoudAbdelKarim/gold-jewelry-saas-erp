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
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions('Customers.View')
  async findAll(@Request() req: any) {
    return this.customersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Permissions('Customers.View')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.customersService.findById(req.user.tenantId, id);
  }

  @Post()
  @Permissions('Customers.Create')
  async create(@Request() req: any, @Body() body: any) {
    return this.customersService.create(req.user.tenantId, body);
  }

  @Put(':id')
  @Permissions('Customers.Edit')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.customersService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  @Permissions('Customers.Edit')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.customersService.delete(req.user.tenantId, id);
  }
}
