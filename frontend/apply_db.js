import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Try with just 'postgres' as user
const connectionString = 'postgresql://postgres:thrushayk%40123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    console.log('Reading schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'backend', 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema applied successfully.');

    console.log('Reading seed.sql...');
    const seed = fs.readFileSync(path.join(__dirname, '..', 'backend', 'seed.sql'), 'utf8');
    await client.query(seed);
    console.log('Seed applied successfully.');

  } catch (err) {
    console.error('Error applying SQL:', err);
  } finally {
    await client.end();
  }
}

run();
