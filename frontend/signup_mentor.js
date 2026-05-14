import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfsmqkqkfpppawvendzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc21xa3FrZnBwcGF3dmVuZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTAzNjYsImV4cCI6MjA5MjY4NjM2Nn0.VQzDTUqhc1rkTQSCEDHJGrsFVc-pkR2xfoUvtU13_EY';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function signupMentor() {
  console.log('Attempting to sign up mentor: nischay@theboringpeople.in');
  const { data, error } = await supabase.auth.signUp({
    email: 'nischay@theboringpeople.in',
    password: 'nischay123',
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
    console.log('Signup successful!', data.user?.id);
    console.log('You can now log in with nischay@theboringpeople.in / nischay123');
  }
}

signupMentor();
