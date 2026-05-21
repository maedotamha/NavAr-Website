const env = require('../../../config/env');
function notFound(req, res){
  res.status(404).json({ error:'Route not found: ' + req.method + ' ' + req.originalUrl });
}
function errorHandler(error, _req, res, _next){
  const status = error.status || 500;
  if(status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message, detail: env.nodeEnv === 'production' ? undefined : error.message });
}
module.exports = { notFound, errorHandler };
