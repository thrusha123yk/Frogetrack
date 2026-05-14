import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfsmqkqkfpppawvendzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc21xa3FrZnBwcGF3dmVuZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTAzNjYsImV4cCI6MjA5MjY4NjM2Nn0.VQzDTUqhc1rkTQSCEDHJGrsFVc-pkR2xfoUvtU13_EY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupMentor() {
  const email = 'nischay@gmail.com';
  const password = 'nischay123';
  
  console.log(`Attempting to sign up mentor: ${email}...`);
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: 'Nischay'
      }
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('User already registered in Auth.');
    } else {
      console.error('Sign up error:', signUpError.message);
    }
  } else {
    console.log('Sign up successful!');
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in error:', signInError.message);
    return;
  }

  const user = signInData.user;
  console.log('Signed in as:', user.id);

  const { error: insertError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      role: 'mentor',
      display_name: 'Nischay'
    });

  if (insertError) {
    console.error('Insert into public.users error:', insertError.message);
  } else {
    console.log('Mentor metadata created in public.users!');
    console.log('--- LOGIN CREDENTIALS ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }
}

setupMentor();
