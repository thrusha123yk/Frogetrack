process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfsmqkqkfpppawvendzw.supabase.co';
const supabaseAnonKey = 'sb_publishable_bTcFI3OyGSvsllWjJJNuig_vWn7SDJF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login for nischay@theboringpeople.in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'nischay@theboringpeople.in',
    password: 'nischay123'
  });

  if (error) {
    console.error('Login failed:', error.message, error.status);
  } else {
    console.log('Login successful!', data.user.id);
  }
}

testLogin();
