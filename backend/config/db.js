// config/db.supabase.js
// Use this file instead of db.js when connecting to Supabase (PostgreSQL)
// Rename this to db.js when deploying to Supabase

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }   // required for Supabase
});

pool.connect()
  .then(client => {
    console.log('✅ Supabase PostgreSQL connected');
    client.release();
  })
  .catch(err => console.error('❌ FULL DB ERROR:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  // Wrap so it returns [rows, fields] like mysql2 does
  // Replace all db.query calls to use this format
};
