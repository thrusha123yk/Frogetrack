import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tfsmqkqkfpppawvendzw.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc21xa3FrZnBwcGF3dmVuZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTAzNjYsImV4cCI6MjA5MjY4NjM2Nn0.VQzDTUqhc1rkTQSCEDHJGrsFVc-pkR2xfoUvtU13_EY';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
} else {
  console.log('Supabase initialized with URL:', supabaseUrl.substring(0, 20) + '...');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
