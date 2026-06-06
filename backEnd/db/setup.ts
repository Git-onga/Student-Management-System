import fs from 'fs';
import path from 'path';
import { pool } from '../src/db';

async function setup() {
  console.log('🔄 Setting up database schema...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('✅ Database schema setup complete.');
  } catch (error) {
    console.error('❌ Error setting up database schema:', error);
  } finally {
    await pool.end();
  }
}

setup();
