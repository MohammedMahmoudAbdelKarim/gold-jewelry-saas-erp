import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password, body.tenantId);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(
      body.name,
      body.email,
      body.password,
      body.tenantId,
      body.role,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('users')
  @Permissions('Users.Manage')
  async getUsers(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.authService.getUsers(tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('users')
  @Permissions('Users.Manage')
  async createUser(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.authService.createUserFull(tenantId, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Put('users/:id')
  @Permissions('Users.Manage')
  async updateUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.authService.updateUser(id, tenantId, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete('users/:id')
  @Permissions('Users.Manage')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.authService.deleteUser(id, tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('roles')
  @Permissions('Users.Manage')
  async getRoles(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.authService.getRoles(tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('roles')
  @Permissions('Users.Manage')
  async createRole(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.authService.createRoleFull(tenantId, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Put('roles/:id')
  @Permissions('Users.Manage')
  async updateRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.authService.updateRoleFull(id, tenantId, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete('roles/:id')
  @Permissions('Users.Manage')
  async deleteRole(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.authService.deleteRoleFull(id, tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('branches')
  @Permissions('Users.Manage')
  async getBranches(@Request() req: any, @Query('activeOnly') activeOnly?: string) {
    const tenantId = req.user.tenantId;
    return this.authService.getBranches(tenantId, activeOnly === 'true');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('branches')
  @Permissions('Users.Manage')
  async createBranch(@Request() req: any, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.authService.createBranch(tenantId, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Put('branches/:id')
  @Permissions('Users.Manage')
  async updateBranch(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user.tenantId;
    return this.authService.updateBranch(id, tenantId, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete('branches/:id')
  @Permissions('Users.Manage')
  async deleteBranch(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.authService.deleteBranch(id, tenantId);
  }
}
