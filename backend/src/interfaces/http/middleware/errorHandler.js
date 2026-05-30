const env = require('../../../config/env');
function notFound(req, res){
  res.status(404).json({ error:'Route not found: ' + req.method + ' ' + req.originalUrl });
}
function safeBody(body){
  if(!body || typeof body !== 'object') return body;
  const copy = Array.isArray(body) ? body.slice(0, 5) : { ...body };
  for(const key of Object.keys(copy)){
    if(/password|token|secret|authorization/i.test(key)) copy[key] = '[redacted]';
  }
  return copy;
}

function errorHandler(error, req, res, _next){
  const status = error.status || 500;
  const isMobileSession = req.originalUrl && req.originalUrl.includes('/mobile/navigation-sessions');
  if(status >= 500) {
    console.error(error);
  } else if(isMobileSession) {
    console.warn('[mobile-session:error]', {
      method: req.method,
      path: req.originalUrl,
      status,
      message: error.message,
      body: safeBody(req.body)
    });
  }
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message, detail: env.nodeEnv === 'production' ? undefined : error.message });
}
module.exports = { notFound, errorHandler };
