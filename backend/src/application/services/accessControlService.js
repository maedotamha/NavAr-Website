const AppError = require('../../domain/AppError');
const { text } = require('../../domain/validators');
const { hashPassword } = require('../../domain/password');

function normalizeKey(value, field) {
  return text(value, field, 120).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
}

function createAccessControlService(repo) {
  return {
    async getOverview() {
      return repo.getAccessControlOverview();
    },

    async createRole(input) {
      const key = normalizeKey(input.key || input.name, 'role key');
      const name = text(input.name, 'role name', 120);
      return repo.createRole({ key, name, description: input.description || '', permissions: input.permissions || [] });
    },

    async updateRole(id, input) {
      const name = text(input.name, 'role name', 120);
      const role = await repo.updateRole(id, { name, description: input.description || '', permissions: input.permissions || [] });
      if (!role) throw new AppError('Role not found', 404);
      return role;
    },

    async deleteRole(id) {
      const deleted = await repo.deleteRole(id);
      if (!deleted) throw new AppError('Role cannot be deleted while locked, missing, or assigned to a user', 400);
      return { deleted: true };
    },

    async assignUserRole(userId, roleId) {
      const user = await repo.assignUserRole(userId, roleId);
      if (!user) throw new AppError('User or role not found', 404);
      return user;
    },

    async createUser(input) {
      const fullName = text(input.full_name || input.fullName, 'full name', 255);
      const email = text(input.email, 'email', 255).toLowerCase();
      const password = text(input.password, 'password', 255);
      const roleId = Number(input.roleId || input.role_id);
      const user = await repo.createAdminUser({ fullName, email, passwordHash: hashPassword(password), roleId, isActive: input.is_active !== false });
      if (!user) throw new AppError('Role not found', 404);
      return user;
    },

    async updateUser(id, input) {
      const payload = {
        fullName: text(input.full_name || input.fullName, 'full name', 255),
        email: text(input.email, 'email', 255).toLowerCase(),
        roleId: Number(input.roleId || input.role_id),
        isActive: input.is_active !== false
      };
      if (input.password) payload.passwordHash = hashPassword(text(input.password, 'password', 255));
      const user = await repo.updateAdminUser(id, payload);
      if (!user) throw new AppError('User or role not found', 404);
      return user;
    },

    async deleteUser(id, authUser) {
      if (Number(authUser?.sub) === Number(id)) throw new AppError('You cannot delete your own account', 400);
      const deleted = await repo.deleteAdminUser(id);
      if (!deleted) throw new AppError('User not found', 404);
      return { deleted: true };
    },

    async createModule(input) {
      const key = normalizeKey(input.key || input.name, 'module key');
      const name = text(input.name, 'module name', 120);
      return repo.createPermissionModule({ key, name, description: input.description || '', actions: input.actions || [] });
    },

    async updateModule(id, input) {
      const name = text(input.name, 'module name', 120);
      const module = await repo.updatePermissionModule(id, { name, description: input.description || '', actions: input.actions || [] });
      if (!module) throw new AppError('Module not found', 404);
      return module;
    },

    async deleteModule(id) {
      const deleted = await repo.deletePermissionModule(id);
      if (!deleted) throw new AppError('Module not found', 404);
      return { deleted: true };
    },
    async listAccessLogs() {
      return repo.listAccessLogs();
    },
    async createAccessLog(actor, action, target) {
      return repo.createAccessLog(actor, action, target);
    }
  };
}

module.exports = createAccessControlService;
