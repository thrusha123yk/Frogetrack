import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfsmqkqkfpppawvendzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc21xa3FrZnBwcGF3dmVuZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTAzNjYsImV4cCI6MjA5MjY4NjM2Nn0.VQzDTUqhc1rkTQSCEDHJGrsFVc-pkR2xfoUvtU13_EY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createNewMentor() {
  const email = 'nischay_new@theboringpeople.in';
  const password = 'nischay123';
  
  console.log('Attempting to sign up NEW mentor...');
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: 'Nischay B K',
        role: 'mentor'
      }
    }
  });

  if (error) {
    console.error('Sign up error:', error.message);
  } else {
    console.log('Sign up successful! User ID:', data.user.id);
    console.log('Now you can try logging in with:');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

createNewMentor();
