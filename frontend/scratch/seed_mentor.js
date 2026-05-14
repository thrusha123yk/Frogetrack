import pg from 'pg';

const connectionString = 'postgresql://postgres:thrushayk%40123@db.tfsmqkqkfpppawvendzw.supabase.co:5432/postgres';

async function seedMentor() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const email = 'nischay@theboringpeople.in';
    const password = 'nischay123';
    const name = 'Nischay';
    
    // 1. Create user in auth.users if not exists
    // We use a generated UUID
    const userId = '00000000-0000-0000-0000-000000000001';
    
    console.log('Checking if mentor exists...');
    const res = await client.query('SELECT id FROM public.users WHERE email = $1', [email]);
    
    if (res.rows.length === 0) {
      console.log('Creating mentor in auth.users and public.users...');
      
      // Note: We need to use crypt() which is in pgcrypto extension
      await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
      
      // Insert into auth.users (Supabase managed)
      // Note: This is a manual insert into auth.users which is usually handled by Supabase API
      // But we have direct DB access.
      await client.query(`
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES ($1, 'authenticated', 'authenticated', $2, crypt($3, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [userId, email, password]);

      // Insert into public.users
      await client.query(`
        INSERT INTO public.users (id, email, role, display_name)
        VALUES ($1, $2, 'mentor', $3)
        ON CONFLICT (id) DO NOTHING
      `, [userId, email, name]);
      
      console.log('Mentor created successfully!');
    } else {
      console.log('Mentor already exists.');
    }

  } catch (err) {
    console.error('Error seeding mentor:', err);
  } finally {
    await client.end();
  }
}

seedMentor();
