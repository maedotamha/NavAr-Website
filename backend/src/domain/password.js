const crypto = require('node:crypto');
const KEY_LENGTH = 64;
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')){
  const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH).toString('hex');
  return 'scrypt$' + salt + '$' + hash;
}
function verifyPassword(password, storedHash){
  if(!storedHash) return false;
  const parts = String(storedHash).split('$');
  if(parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const expected = hashPassword(password, parts[1]);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(storedHash));
}
module.exports = { hashPassword, verifyPassword };