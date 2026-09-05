import { Controller, Get, Put, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.notificationsRepository.findAll(req.user.tenantId);
  }

  @Put(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsRepository.markAsRead(id, req.user.tenantId);
  }

  @Put('read-all')
  async markAllAsRead(@Request() req: any) {
    await this.notificationsRepository.markAllAsRead(req.user.tenantId);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.notificationsRepository.delete(id, req.user.tenantId);
  }
}
