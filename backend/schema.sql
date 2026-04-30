-- Students Table
CREATE TABLE public.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    admission_number TEXT,
    email TEXT,
    branch_code TEXT NOT NULL,
    batch TEXT DEFAULT '2024-2028',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE public.sessions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    topic TEXT NOT NULL,
    month_number INTEGER NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    session_type TEXT DEFAULT 'offline',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ImportLog Table
CREATE TABLE public.import_log (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_rows INTEGER NOT NULL,
    imported_rows INTEGER NOT NULL,
    skipped_rows INTEGER NOT NULL,
    warnings TEXT,
    column_mapping TEXT,
    status TEXT NOT NULL
);

-- Attendance Table
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id),
    session_id INTEGER NOT NULL REFERENCES public.sessions(id),
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marked_by TEXT DEFAULT 'system',
    import_id INTEGER REFERENCES public.import_log(id),
    UNIQUE(student_id, session_id)
);

-- Materials Table
CREATE TABLE public.materials (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (Mapping for Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
    student_id INTEGER REFERENCES public.students(id),
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraints
CREATE OR REPLACE FUNCTION check_attendance_date()
RETURNS TRIGGER AS $$
DECLARE
    session_date DATE;
BEGIN
    SELECT date INTO session_date FROM public.sessions WHERE id = NEW.session_id;
    IF session_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Attendance date cannot be in the future';
    END IF;
    IF session_date < '2025-08-04' THEN
        RAISE EXCEPTION 'Attendance date cannot be before program start date (2025-08-04)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_attendance_date_trigger
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION check_attendance_date();

-- Auth trigger to auto-create a user when a student is inserted
CREATE OR REPLACE FUNCTION handle_new_student()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
    student_email TEXT;
BEGIN
    student_email := NEW.usn || '@forge.local';
    
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      student_email,
      crypt(NEW.usn, gen_salt('bf')),
      NOW(),
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;

    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (new_user_id, student_email, 'student', NEW.id, NEW.name);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION handle_new_student();

-- Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_mentor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING (is_mentor());
CREATE POLICY "students_read_own" ON public.students FOR SELECT USING (id = (SELECT student_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING (is_mentor());
CREATE POLICY "students_read_sessions" ON public.sessions FOR SELECT USING (true);

CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING (is_mentor());
CREATE POLICY "students_read_own_attendance" ON public.attendance FOR SELECT USING (student_id = (SELECT student_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING (is_mentor());
CREATE POLICY "students_read_all_materials" ON public.materials FOR SELECT USING (true);

CREATE POLICY "mentors_all_import_log" ON public.import_log FOR ALL USING (is_mentor());

CREATE POLICY "mentors_all_users" ON public.users FOR ALL USING (is_mentor());
CREATE POLICY "students_read_own_user" ON public.users FOR SELECT USING (id = auth.uid());
