const AppError = require('./AppError');
function number(value, label){
  const parsed = Number(value);
  if(!Number.isFinite(parsed)) throw new AppError(label + ' must be a valid number', 400);
  return parsed;
}
function integer(value, label){
  const parsed = Number(value);
  if(!Number.isInteger(parsed)) throw new AppError(label + ' must be a valid integer', 400);
  return parsed;
}
function text(value, label, max = 255){
  const parsed = String(value || '').trim();
  if(!parsed) throw new AppError(label + ' is required', 400);
  return parsed.slice(0, max);
}
module.exports = { number, integer, text };