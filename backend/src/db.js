import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('[V2] DATABASE_URL ainda não configurada.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function testarBanco() {
  const r = await pool.query('SELECT NOW() AS agora');
  return r.rows[0];
}
