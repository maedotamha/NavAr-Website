const AppError = require('../../domain/AppError');
const { text } = require('../../domain/validators');
const { verifyPassword } = require('../../domain/password');
const { signToken } = require('../../domain/token');
const env = require('../../config/env');
function publicAdmin(user){
  return { id:user.id, full_name:user.full_name, email:user.email, role:user.role, role_id:user.role_id, role_name:user.role_name || user.role, permissions:user.permissions || [], last_login_at:user.last_login_at };
}
function createAuthService(repo){
  return {
    async login(input){
      const email = text(input.email, 'email', 255).toLowerCase();
      const password = String(input.password || '');
      const user = await repo.findAdminByEmail(email);
      if(!user || !user.is_active || !verifyPassword(password, user.password_hash)) throw new AppError('Invalid email or password', 401);
      await repo.updateAdminLastLogin(user.id);
      const token = signToken({ sub:user.id, email:user.email, role:user.role, permissions:user.permissions || [] }, env.authSecret, env.adminTokenTtlSeconds);
      return { token, admin: publicAdmin(user), expires_in: env.adminTokenTtlSeconds };
    },
    async getCurrentUser(authUser){
      if(!authUser || !authUser.sub) throw new AppError('Authentication required', 401);
      const user = await repo.findAdminById(authUser.sub);
      if(!user || !user.is_active) throw new AppError('Authentication required', 401);
      return publicAdmin(user);
    }
  };
}
module.exports = createAuthService;
