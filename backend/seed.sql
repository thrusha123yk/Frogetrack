-- Mentor user
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'nischay@theboringpeople.in', crypt('nischay123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'varun@theboringpeople.in', crypt('varun123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');

INSERT INTO public.users (id, email, role, display_name)
SELECT id, email, 'mentor', CASE WHEN email = 'nischay@theboringpeople.in' THEN 'Nischay B K' ELSE 'Varun' END
FROM auth.users WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

-- The trigger `on_student_created` handles creating auth.users and public.users for students.
INSERT INTO public.students (name, usn, branch_code) VALUES
('Abhishek Sharma', '4SH24CS001', 'CS'),
('Divya Kulkarni', '4SH24CS002', 'AI'),
('Ravi Kumar', '4SH24CS003', 'CS'),
('Aditi Rao', '4SH24IS001', 'IS'),
('Arjun M', '4SH24AI001', 'AI'),
('Bhavya Shetty', '4SH24CS004', 'CS'),
('Chetan Gowda', '4SH24IS002', 'IS'),
('Deepak N', '4SH24CS005', 'CS'),
('Esha Singh', '4SH24AI002', 'AI'),
('Gagan T', '4SH24IS003', 'IS'),
('Harshith V', '4SH24CS006', 'CS'),
('Ishika Jain', '4SH24CS007', 'CS'),
('Karthik S', '4SH24AI003', 'AI'),
('Lakshmi R', '4SH24IS004', 'IS'),
('Manoj P', '4SH24CS008', 'CS'),
('Nandini K', '4SH24AI004', 'AI'),
('Omkar B', '4SH24CS009', 'CS'),
('Pooja M', '4SH24IS005', 'IS'),
('Rahul K', '4SH24CS010', 'CS'),
('Sneha L', '4SH24AI005', 'AI'),
('Tarun J', '4SH24CS011', 'CS'),
('Uday C', '4SH24IS006', 'IS'),
('Varsha N', '4SH24CS012', 'CS'),
('Yashaswini', '4SH24AI006', 'AI'),
('Zoya F', '4SH24CS013', 'CS');

-- Sessions
INSERT INTO public.sessions (date, topic, month_number) VALUES
('2025-08-05', 'Introduction to AI-ML', 1),
('2025-08-12', 'Python for AI', 1),
('2025-08-19', 'Linear Algebra Basics', 1),
('2025-10-05', '8-Layer AI Stack', 3),
('2025-10-12', 'Data Preprocessing', 3),
('2025-11-02', 'ReAct Agent Pattern', 4),
('2025-11-09', 'Prompt Engineering', 4),
('2025-11-16', 'RAG Fundamentals', 4),
('2025-12-07', 'pgvector RAG', 5),
('2025-12-14', 'Tiered Autonomy Multi-Agent', 5),
('2026-01-04', 'LLM Fine-tuning', 6),
('2026-01-11', 'Deployment with Vercel', 6),
('2026-02-08', 'Supabase Vector', 7),
('2026-02-15', 'Agentic Workflows', 7),
('2026-03-01', 'Capstone Kickoff', 8);

-- Attendance
INSERT INTO public.attendance (student_id, session_id, present, marked_by)
SELECT st.id, se.id, random() < 0.8, 'Nischay B K'
FROM public.students st
CROSS JOIN public.sessions se;

-- Materials
INSERT INTO public.materials (session_id, title, type, url)
SELECT id, topic || ' Slides', 'slides', 'https://docs.google.com/presentation/d/example'
FROM public.sessions;

INSERT INTO public.materials (session_id, title, type, url)
SELECT id, topic || ' Recording', 'recording', 'https://youtube.com/watch?v=example'
FROM public.sessions;

-- ImportLog
INSERT INTO public.import_log (filename, uploaded_by, uploaded_at, total_rows, imported_rows, skipped_rows, status)
VALUES
('month1_attendance.csv', 'Nischay B K', '2025-09-01 10:00:00+00', 50, 50, 0, 'completed'),
('month2_attendance.csv', 'Nischay B K', '2025-10-01 10:00:00+00', 75, 75, 0, 'completed');
