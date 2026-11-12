-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "claim own non-admin role" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role <> 'admin');

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Domain tables
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  years_handled TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers readable" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "teachers admin write" ON public.teachers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'classroom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms readable" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms admin write" ON public.rooms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  subject TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL DEFAULT 1,
  student_count INTEGER NOT NULL DEFAULT 40,
  room_type TEXT NOT NULL DEFAULT 'classroom',
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes readable" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes admin write" ON public.classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules readable" ON public.schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedules admin write" ON public.schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.schedule_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_by UUID,
  classes_scheduled INTEGER NOT NULL DEFAULT 0,
  rooms_used INTEGER NOT NULL DEFAULT 0,
  teachers_assigned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.schedule_runs TO authenticated;
GRANT ALL ON public.schedule_runs TO service_role;
ALTER TABLE public.schedule_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "runs readable" ON public.schedule_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "runs admin insert" ON public.schedule_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings readable" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "bookings insert own" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "bookings admin update" ON public.bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings admin delete" ON public.bookings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed data
INSERT INTO public.teachers (id, name, subject, years_handled, email) VALUES
  ('11111111-1111-4111-8111-111111111101', 'Dr. Aditi Menon', 'Cybersecurity', '3rd, 4th Year', 'aditi.menon@campus.edu'),
  ('11111111-1111-4111-8111-111111111102', 'Prof. Rahul Verma', 'Data Structures', '1st, 2nd Year', 'rahul.verma@campus.edu'),
  ('11111111-1111-4111-8111-111111111103', 'Dr. Sneha Kulkarni', 'Database Systems', '2nd, 3rd Year', 'sneha.kulkarni@campus.edu');

INSERT INTO public.rooms (room_number, capacity, room_type) VALUES
  ('A101', 60, 'classroom'),
  ('A102', 50, 'classroom'),
  ('B201', 45, 'classroom'),
  ('LAB-01', 40, 'lab'),
  ('AUD-1', 200, 'auditorium');

INSERT INTO public.classes (year, subject, hours_per_week, student_count, room_type, teacher_id) VALUES
  ('1st Year', 'Data Structures', 3, 45, 'classroom', '11111111-1111-4111-8111-111111111102'),
  ('1st Year', 'Programming Lab', 2, 35, 'lab', '11111111-1111-4111-8111-111111111102'),
  ('2nd Year', 'Database Systems', 3, 40, 'classroom', '11111111-1111-4111-8111-111111111103'),
  ('2nd Year', 'DBMS Lab', 2, 30, 'lab', '11111111-1111-4111-8111-111111111103'),
  ('3rd Year', 'Cybersecurity', 3, 50, 'classroom', '11111111-1111-4111-8111-111111111101'),
  ('3rd Year', 'Network Security Lab', 2, 32, 'lab', '11111111-1111-4111-8111-111111111101'),
  ('4th Year', 'Ethical Hacking', 2, 40, 'classroom', '11111111-1111-4111-8111-111111111101'),
  ('4th Year', 'Advanced Databases', 2, 38, 'classroom', '11111111-1111-4111-8111-111111111103');