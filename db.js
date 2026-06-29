const ADODB = require('node-adodb');
const path = require('path');
require('dotenv').config();

// MS Access .accdb file path
const dbPath = path.resolve(__dirname, process.env.DB_PATH || './bookstore.accdb');
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};`;

let connection = null;

function getConnection() {
  if (!connection) {
    connection = ADODB.open(connectionString, true);
  }
  return connection;
}

// Escape a value for safe SQL insertion
function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  // String — escape single quotes by doubling them
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Replace ? placeholders with escaped values
function processParams(sql, params) {
  let result = sql;
  for (const param of params) {
    result = result.replace('?', escapeValue(param));
  }
  return result;
}

// Main query wrapper — mimics pool.query() return format: { rows: [...] }
async function query(sql, params = []) {
  const processedSql = processParams(sql, params);
  const conn = getConnection();

  const type = processedSql.trim().split(/\s+/)[0].toUpperCase();

  try {
    if (type === 'SELECT') {
      const data = await conn.query(processedSql);
      return { rows: data || [] };
    } else if (type === 'INSERT') {
      // INSERT — return last auto-generated ID
      const data = await conn.execute(processedSql, 'SELECT @@Identity AS lastId');
      const lastId = (data && data[0]) ? parseInt(data[0].lastId) : null;
      return { rows: [], lastId };
    } else {
      // UPDATE / DELETE
      await conn.execute(processedSql);
      return { rows: [] };
    }
  } catch (err) {
    if (err.process) {
      let detail = err.process;
      if (typeof detail === 'string') {
        try {
          detail = JSON.parse(detail);
        } catch (parseErr) {
          detail = { message: detail };
        }
      }
      const newErr = new Error(detail.message || err.message);
      newErr.code = detail.code;
      newErr.originalError = err;
      throw newErr;
    }
    throw err;
  }
}

// Connection test — mimics pool.connect(callback)
function connect(callback) {
  const conn = getConnection();
  conn.query('SELECT NOW() AS test_time')
    .then(() => {
      callback(null, null, () => {});
    })
    .catch((err) => {
      callback(err);
    });
}

// Export a pool-compatible object
module.exports = { query, connect };