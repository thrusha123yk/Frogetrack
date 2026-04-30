process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfsmqkqkfpppawvendzw.supabase.co';
const supabaseAnonKey = 'sb_publishable_bTcFI3OyGSvsllWjJJNuig_vWn7SDJF';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function signupMentor() {
  console.log('Attempting to sign up mentor...');
  const { data, error } = await supabase.auth.signUp({
    email: 'mentor@example.com',
    password: 'password123',
    options: {
      data: {
        role: 'mentor',
        display_name: 'Nischay B K'
      }
    }
  });

  if (error) {
    console.error('Signup failed:', error.message, error.status);
  } else {
    console.log('Signup successful!', data.user.id);
  }
}

signupMentor();
