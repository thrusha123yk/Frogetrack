import pg from 'pg';
import dns from 'dns';
const { Client } = pg;

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

const connectionString = 'postgresql://postgres:thrushayk%40123@db.tfsmqkqkfpppawvendzw.supabase.co:5432/postgres';

async function checkUsers() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    console.log('\n--- AUTH.USERS ---');
    const authUsers = await client.query('SELECT id, email, created_at FROM auth.users');
    console.table(authUsers.rows);

    console.log('\n--- PUBLIC.USERS ---');
    const publicUsers = await client.query('SELECT id, email, role, display_name FROM public.users');
    console.table(publicUsers.rows);

  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    await client.end();
  }
}

checkUsers();
