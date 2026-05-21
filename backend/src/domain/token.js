const crypto = require('node:crypto');
const AppError = require('./AppError');
function base64url(input){
  return Buffer.from(input).toString('base64url');
}
function signToken(payload, secret, expiresInSeconds = 8 * 60 * 60){
  if(!secret) throw new AppError('AUTH_SECRET is not configured', 500);
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(body));
  const signature = crypto.createHmac('sha256', secret).update(encodedHeader + '.' + encodedPayload).digest('base64url');
  return encodedHeader + '.' + encodedPayload + '.' + signature;
}
function verifyToken(token, secret){
  if(!secret) throw new AppError('AUTH_SECRET is not configured', 500);
  const parts = String(token || '').split('.');
  if(parts.length !== 3) throw new AppError('Invalid authentication token', 401);
  const expected = crypto.createHmac('sha256', secret).update(parts[0] + '.' + parts[1]).digest('base64url');
  if(!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]))) throw new AppError('Invalid authentication token', 401);
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if(payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new AppError('Authentication token expired', 401);
  return payload;
}
module.exports = { signToken, verifyToken };