import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfsmqkqkfpppawvendzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc21xa3FrZnBwcGF3dmVuZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTAzNjYsImV4cCI6MjA5MjY4NjM2Nn0.VQzDTUqhc1rkTQSCEDHJGrsFVc-pkR2xfoUvtU13_EY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupMentor() {
  const email = 'nischay@theboringpeople.in';
  const password = 'nischay123';
  
  console.log('Attempting to sign up mentor...');
  
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
      return;
    }
  } else {
    console.log('Sign up successful!');
  }

  // Even if sign up fails (because user exists), we want to make sure the public.users row exists
  // However, without a session or service_role key, we might hit RLS.
  // But wait, the mentor login is what the user wants.
  
  // Let's try to sign in first to get a session
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

  // Now try to insert into public.users (this might fail if RLS is tight)
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
  }
}

setupMentor();
