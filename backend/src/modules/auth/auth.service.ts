import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository, User } from './user.repository';
import { AuditRepository } from '../audit/audit.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly auditRepository: AuditRepository,
  ) {}

  async validateUser(
    email: string,
    pass: string,
    tenantId: string,
  ): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.userRepository.findByEmail(email, tenantId);
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (isMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...rest } = user;
      return rest;
    }
    return null;
  }

  async login(email: string, pass: string, tenantId: string) {
    const user = await this.validateUser(email, pass, tenantId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const permissions = await this.userRepository.findPermissionsByRoleId(user.role_id);
    await this.auditRepository.record({
      tenantId: user.tenant_id,
      userEmail: user.email,
      action: 'login',
      entityType: 'auth',
      details: `${user.name} signed in`,
    });
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      role: user.role_name,
      branchId: user.home_branch_id,
      permissions: permissions,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        branchId: user.home_branch_id,
        permissions: permissions,
      },
    };
  }

  async register(
    name: string,
    email: string,
    pass: string,
    tenantId: string,
    roleName: string = 'Sales Associate',
  ): Promise<{ id: string; name: string; email: string }> {
    // Check if user exists
    const userExists = await this.userRepository.checkUserExists(
      email,
      tenantId,
    );
    if (userExists) {
      throw new BadRequestException('User already registered');
    }

    // Get Role ID
    const role = await this.userRepository.findRoleByName(roleName, tenantId);
    let roleId: string;
    if (!role) {
      // Create default role
      const defaultPerms = JSON.stringify({
        sales: ['read', 'create'],
        inventory: ['read'],
      });
      const newRole = await this.userRepository.createRole(
        tenantId,
        roleName,
        defaultPerms,
      );
      roleId = newRole.id;
    } else {
      roleId = role.id;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass, salt);

    const newUser = await this.userRepository.createUser(
      tenantId,
      roleId,
      name,
      email,
      hash,
    );

    return newUser;
  }

  async getUsers(tenantId: string): Promise<any[]> {
    return this.userRepository.findAll(tenantId);
  }

  async createUserFull(tenantId: string, data: any): Promise<any> {
    const userExists = await this.userRepository.checkUserExists(data.email, tenantId);
    if (userExists) {
      throw new BadRequestException('User already registered');
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password || 'password123', salt);
    return this.userRepository.createUserFull(
      tenantId,
      data.roleId,
      data.name,
      data.email,
      hash,
      data.homeBranchId,
      data.avatarUrl,
      data.phone,
      data.address,
    );
  }

  async updateUser(id: string, tenantId: string, data: any): Promise<any> {
    return this.userRepository.updateUser(id, tenantId, data);
  }

  async deleteUser(id: string, tenantId: string): Promise<boolean> {
    return this.userRepository.deleteUser(id, tenantId);
  }

  async getRoles(tenantId: string): Promise<any[]> {
    return this.userRepository.getRoles(tenantId);
  }

  async createRoleFull(tenantId: string, data: any): Promise<any> {
    return this.userRepository.createRoleFull(tenantId, data.name, data.permissions || []);
  }

  async updateRoleFull(id: string, tenantId: string, data: any): Promise<any> {
    return this.userRepository.updateRoleFull(id, tenantId, data.name, data.permissions || []);
  }

  async deleteRoleFull(id: string, tenantId: string): Promise<boolean> {
    return this.userRepository.deleteRoleFull(id, tenantId);
  }

  async getBranches(tenantId: string, activeOnly = false): Promise<any[]> {
    return this.userRepository.getBranches(tenantId, activeOnly);
  }

  async createBranch(tenantId: string, data: any): Promise<any> {
    return this.userRepository.createBranch(tenantId, data.name, data.branchType || 'retail', data.location);
  }

  async updateBranch(id: string, tenantId: string, data: any): Promise<any> {
    return this.userRepository.updateBranch(id, tenantId, data.name, data.branchType, data.location, data.isActive);
  }

  async deleteBranch(id: string, tenantId: string): Promise<boolean> {
    return this.userRepository.deleteBranch(id, tenantId);
  }
}
