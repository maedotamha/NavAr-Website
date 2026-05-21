const { Pool } = require('pg');
const env = require('../../config/env');
const AppError = require('../../domain/AppError');
const pool = new Pool({ connectionString: env.databaseUrl, max: 10, idleTimeoutMillis: 30000 });
function ensureDatabase(){
  if(!env.databaseUrl) throw new AppError('DATABASE_URL is not configured', 503);
}
async function query(text, params = []){
  ensureDatabase();
  return pool.query(text, params);
}
function pointSelect(column = 'location'){
  return 'ST_Y(' + column + '::geometry) AS latitude, ST_X(' + column + '::geometry) AS longitude';
}
function pointValue(longitudeParam, latitudeParam){
  return 'ST_SetSRID(ST_MakePoint(' + longitudeParam + ', ' + latitudeParam + '), 4326)::geography';
}
module.exports = { pool, query, pointSelect, pointValue };