const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'love_pcsy',   // <-- yaha apna DB name daalna
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// IMPORTANT: yaha .promise() NAHI lagana
module.exports = pool;

