import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Use the direct connection string
const connectionString = 'postgresql://postgres:thrushayk%40123@db.tfsmqkqkfpppawvendzw.supabase.co:5432/postgres';

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    console.log('Applying Schema...');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'backend', 'schema.sql'), 'utf8');
    await client.query(schema);

    console.log('Applying Restored Seed Data...');
    const seed = fs.readFileSync(path.join(__dirname, '..', 'backend', 'seed.sql'), 'utf8');
    await client.query(seed);

    console.log('Database restored successfully!');
    console.log('--- MENTOR LOGIN ---');
    console.log('Email: nischay@theboringpeople.in');
    console.log('Password: nischay123');

  } catch (err) {
    console.error('Error applying SQL:', err);
    console.log('\nTIP: If you see "ENOTFOUND", it might be a DNS issue. Try connecting via the Supabase SQL Editor in your browser by pasting the contents of backend/schema.sql and then backend/seed.sql');
  } finally {
    await client.end();
  }
}

run();
