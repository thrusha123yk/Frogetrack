import pg from 'pg';
const { Client } = pg;

const password = 'thrushayk%40123';
const projectId = 'tfsmqkqkfpppawvendzw';

const configs = [
  { name: 'Direct IPv4 (if exists)', host: `${projectId}.supabase.co`, port: 5432, user: 'postgres' },
  { name: 'Pooler AP-SOUTH-1', host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543, user: `postgres.${projectId}` },
  { name: 'Pooler US-EAST-1', host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${projectId}` },
  { name: 'Direct DB Host', host: `db.${projectId}.supabase.co`, port: 5432, user: 'postgres' },
  { name: 'Pooler IP AP-SOUTH-1', host: '3.108.251.216', port: 6543, user: `postgres.${projectId}` },
  { name: 'Pooler Ref as DB Name', host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543, user: 'postgres', database: projectId },
  { name: 'Direct DB Host Pooler Port', host: `db.${projectId}.supabase.co`, port: 6543, user: 'postgres' },
];

async function test() {
  for (const config of configs) {
    console.log(`Testing ${config.name}...`);
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: 'thrushayk@123',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`SUCCESS: ${config.name} connected!`);
      await client.end();
      return;
    } catch (err) {
      console.error(`FAILED: ${config.name}: ${err.message}`);
    }
  }
}

test();
