import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfsmqkqkfpppawvendzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc21xa3FrZnBwcGF3dmVuZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTAzNjYsImV4cCI6MjA5MjY4NjM2Nn0.VQzDTUqhc1rkTQSCEDHJGrsFVc-pkR2xfoUvtU13_EY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyStudentSorting() {
  console.log('Fetching students sorted by name...');
  const { data, error } = await supabase
    .from('students')
    .select('name')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Top 5 students (alphabetical):');
    data.forEach((s, i) => console.log(`${i+1}. ${s.name}`));
  }
}

verifyStudentSorting();
