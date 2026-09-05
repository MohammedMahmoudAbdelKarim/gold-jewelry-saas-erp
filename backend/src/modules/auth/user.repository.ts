import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface User {
  id: string;
  tenant_id: string;
  role_id: string;
  name: string;
  email: string;
  password_hash: string;
  home_branch_id?: string;
  role_name: string;
  is_active: boolean;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  permissions: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 AND u.tenant_id = $2 AND u.is_active = true
    `;
    const result = await this.dbService.query(query, [email, tenantId]);
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  }

  async checkUserExists(email: string, tenantId: string): Promise<boolean> {
    const result = await this.dbService.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId],
    );
    return result.rows.length > 0;
  }

  async findRoleByName(name: string, tenantId: string): Promise<Role | null> {
    const result = await this.dbService.query(
      'SELECT id FROM roles WHERE name = $1 AND tenant_id = $2',
      [name, tenantId],
    );
    return result.rows.length > 0 ? (result.rows[0] as Role) : null;
  }

  async createRole(
    tenantId: string,
    name: string,
    permissions: string,
  ): Promise<Role> {
    const result = await this.dbService.query(
      'INSERT INTO roles (tenant_id, name, permissions) VALUES ($1, $2, $3) RETURNING id, tenant_id, name, permissions',
      [tenantId, name, permissions],
    );
    return result.rows[0] as Role;
  }

  async createUser(
    tenantId: string,
    roleId: string,
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<{ id: string; name: string; email: string }> {
    const query = `
      INSERT INTO users (tenant_id, role_id, name, email, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email
    `;
    const result = await this.dbService.query(query, [
      tenantId,
      roleId,
      name,
      email,
      passwordHash,
    ]);
    return result.rows[0] as { id: string; name: string; email: string };
  }

  async createUserFull(
    tenantId: string,
    roleId: string,
    name: string,
    email: string,
    passwordHash: string,
    homeBranchId?: string,
    avatarUrl?: string,
    phone?: string,
    address?: string,
  ): Promise<any> {
    const query = `
      INSERT INTO users (tenant_id, role_id, name, email, password_hash, home_branch_id, avatar_url, phone, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, tenant_id, role_id, name, email, home_branch_id, is_active, avatar_url, phone, address
    `;
    const result = await this.dbService.query(query, [
      tenantId,
      roleId,
      name,
      email,
      passwordHash,
      homeBranchId || null,
      avatarUrl || null,
      phone || null,
      address || null,
    ]);
    return result.rows[0];
  }

  async findAll(tenantId: string): Promise<any[]> {
    const query = `
      SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.home_branch_id, u.is_active, u.avatar_url, u.phone, u.address,
             r.name as role_name, b.name as branch_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.home_branch_id = b.id
      WHERE u.tenant_id = $1
      ORDER BY u.created_at DESC
    `;
    const result = await this.dbService.query(query, [tenantId]);
    return result.rows;
  }

  async updateUser(id: string, tenantId: string, data: any): Promise<any> {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let count = 3;

    if (data.name !== undefined) {
      sets.push(`name = $${count++}`);
      params.push(data.name);
    }
    if (data.email !== undefined) {
      sets.push(`email = $${count++}`);
      params.push(data.email);
    }
    if (data.roleId !== undefined) {
      sets.push(`role_id = $${count++}`);
      params.push(data.roleId);
    }
    if (data.homeBranchId !== undefined) {
      sets.push(`home_branch_id = $${count++}`);
      params.push(data.homeBranchId || null);
    }
    if (data.isActive !== undefined) {
      sets.push(`is_active = $${count++}`);
      params.push(data.isActive);
    }
    if (data.avatarUrl !== undefined) {
      sets.push(`avatar_url = $${count++}`);
      params.push(data.avatarUrl || null);
    }
    if (data.phone !== undefined) {
      sets.push(`phone = $${count++}`);
      params.push(data.phone || null);
    }
    if (data.address !== undefined) {
      sets.push(`address = $${count++}`);
      params.push(data.address || null);
    }

    if (sets.length === 0) return null;

    const query = `
      UPDATE users
      SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, name, email, role_id, home_branch_id, is_active, avatar_url, phone, address
    `;
    const result = await this.dbService.query(query, params);
    return result.rows[0];
  }

  async deleteUser(id: string, tenantId: string): Promise<boolean> {
    const result = await this.dbService.query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRoles(tenantId: string): Promise<any[]> {
    if (this.dbService.isMockMode) {
      return this.dbService.mockRoles;
    }

    const result = await this.dbService.query(
      'SELECT id, name FROM roles WHERE tenant_id = $1',
      [tenantId]
    );

    const roles: any[] = [];
    for (const r of result.rows) {
      const perms = await this.findPermissionsByRoleId(r.id);
      roles.push({
        id: r.id,
        name: r.name,
        permissions: perms,
      });
    }
    return roles;
  }

  async createRoleFull(
    tenantId: string,
    name: string,
    permissions: string[],
  ): Promise<any> {
    if (this.dbService.isMockMode) {
      const newRole = {
        id: 'mock-role-' + Math.random().toString(36).substr(2, 9),
        name,
        permissions,
      };
      this.dbService.mockRoles.push(newRole);
      return newRole;
    }

    const roleRes = await this.dbService.query(
      'INSERT INTO roles (tenant_id, name) VALUES ($1, $2) RETURNING id, name',
      [tenantId, name],
    );
    const roleId = roleRes.rows[0].id;

    for (const p of permissions) {
      await this.dbService.query(
        `INSERT INTO role_permissions (role_id, permission_id, access_level) 
         VALUES ($1, (SELECT id FROM permissions WHERE name = $2), 'write')`,
        [roleId, p],
      );
    }

    return { id: roleId, name, permissions };
  }

  async updateRoleFull(
    id: string,
    tenantId: string,
    name: string,
    permissions: string[],
  ): Promise<any> {
    if (this.dbService.isMockMode) {
      const role = this.dbService.mockRoles.find((r) => r.id === id);
      if (role) {
        role.name = name;
        role.permissions = permissions;
      }
      return role;
    }

    await this.dbService.query(
      'UPDATE roles SET name = $1 WHERE id = $2 AND tenant_id = $3',
      [name, id, tenantId],
    );

    await this.dbService.query(
      'DELETE FROM role_permissions WHERE role_id = $1',
      [id],
    );

    for (const p of permissions) {
      await this.dbService.query(
        `INSERT INTO role_permissions (role_id, permission_id, access_level) 
         VALUES ($1, (SELECT id FROM permissions WHERE name = $2), 'write')`,
        [id, p],
      );
    }

    return { id, name, permissions };
  }

  async deleteRoleFull(id: string, tenantId: string): Promise<boolean> {
    if (this.dbService.isMockMode) {
      const index = this.dbService.mockRoles.findIndex((r) => r.id === id);
      if (index > -1) {
        this.dbService.mockRoles.splice(index, 1);
        return true;
      }
      return false;
    }

    await this.dbService.query(
      'DELETE FROM role_permissions WHERE role_id = $1',
      [id],
    );

    const res = await this.dbService.query(
      'DELETE FROM roles WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );

    return res.rowCount ? res.rowCount > 0 : false;
  }

  async getBranches(tenantId: string, activeOnly = false): Promise<any[]> {
    const query = activeOnly
      ? 'SELECT id, name, branch_type, location, is_active FROM branches WHERE tenant_id = $1 AND is_active = true ORDER BY name ASC'
      : 'SELECT id, name, branch_type, location, is_active FROM branches WHERE tenant_id = $1 ORDER BY name ASC';
    const result = await this.dbService.query(query, [tenantId]);
    return result.rows;
  }

  async createBranch(tenantId: string, name: string, type: string, location: string): Promise<any> {
    const query = `
      INSERT INTO branches (tenant_id, name, branch_type, location, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, tenant_id, name, branch_type, location, is_active
    `;
    const result = await this.dbService.query(query, [tenantId, name, type, location]);
    return result.rows[0];
  }

  async updateBranch(id: string, tenantId: string, name: string, type: string, location: string, isActive: boolean): Promise<any> {
    const query = `
      UPDATE branches
      SET name = $3, branch_type = $4, location = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, tenant_id, name, branch_type, location, is_active
    `;
    const result = await this.dbService.query(query, [id, tenantId, name, type, location, isActive]);
    return result.rows[0];
  }

  async deleteBranch(id: string, tenantId: string): Promise<boolean> {
    if (this.dbService.isMockMode) {
      const index = this.dbService.mockBranches.findIndex((b) => b.id === id);
      if (index > -1) {
        this.dbService.mockBranches.splice(index, 1);
        return true;
      }
      return false;
    }
    const result = await this.dbService.query(
      'DELETE FROM branches WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async findPermissionsByRoleId(roleId: string): Promise<string[]> {
    const query = `
      SELECT p.name 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1 AND rp.access_level != 'none'
    `;
    const result = await this.dbService.query(query, [roleId]);
    return result.rows.map((row) => row.name);
  }
}
