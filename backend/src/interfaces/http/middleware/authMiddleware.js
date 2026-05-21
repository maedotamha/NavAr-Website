const AppError = require('../../../domain/AppError');
const { verifyToken } = require('../../../domain/token');
const env = require('../../../config/env');
function requireAdmin(req, _res, next){
  try{
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if(!token) throw new AppError('Authentication required', 401);
    req.auth = verifyToken(token, env.authSecret);
    next();
  }catch(error){
    next(error);
  }
}
function requirePermission(permission){
  return (req, _res, next) => {
    requireAdmin(req, _res, error => {
      if(error) return next(error);
      const permissions = req.auth.permissions || [];
      if(!permissions.includes(permission)) return next(new AppError('Missing permission: ' + permission, 403));
      next();
    });
  };
}
module.exports = { requireAdmin, requirePermission };
