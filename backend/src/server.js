const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const db = require('./infrastructure/database/postgres');
const controllers = require('./compositionRoot');
const createRoutes = require('./interfaces/http/routes');
const { notFound, errorHandler } = require('./interfaces/http/middleware/errorHandler');
const app = express();
const corsOriginPatterns = env.corsOriginPatterns.map(pattern => new RegExp(pattern));
function isAllowedOrigin(origin){
  return !origin || env.corsOrigins.includes(origin) || corsOriginPatterns.some(pattern => pattern.test(origin));
}
app.use(helmet());
app.use(cors({ origin(origin, callback){ if(isAllowedOrigin(origin)) return callback(null, true); return callback(new Error('CORS blocked origin: ' + origin)); }, credentials:true }));
app.use(express.json({ limit:'2mb' }));
app.use(morgan('dev'));
app.get('/api/health', async (_req,res)=>{
  try{
    await db.query('SELECT 1');
    res.json({ ok:true, database:'connected', architecture:'clean' });
  }catch(error){
    res.status(error.status || 500).json({ ok:false, database:'unavailable', message:error.message });
  }
});
app.use('/api', createRoutes(controllers));
app.use(notFound);
app.use(errorHandler);
app.listen(env.port, ()=>console.log('NavAR backend listening on http://localhost:' + env.port));
