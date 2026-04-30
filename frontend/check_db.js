import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:thrushayk%40123@db.tfsmqkqkfpppawvendzw.supabase.co:5432/postgres';

async function check() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected!');

    const authUsers = await client.query('SELECT count(*) FROM auth.users');
    console.log('Auth users count:', authUsers.rows[0].count);

    const publicUsers = await client.query('SELECT count(*) FROM public.users');
    console.log('Public users count:', publicUsers.rows[0].count);

    const mentors = await client.query("SELECT email FROM auth.users WHERE email LIKE '%@theboringpeople.in'");
    console.log('Mentors in auth.users:', mentors.rows.map(r => r.email));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

check();
