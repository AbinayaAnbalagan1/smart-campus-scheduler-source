CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Repoint all policies at the private helper
DROP POLICY IF EXISTS "bookings admin delete" ON public.bookings;
CREATE POLICY "bookings admin delete" ON public.bookings FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "bookings admin update" ON public.bookings;
CREATE POLICY "bookings admin update" ON public.bookings FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "bookings readable" ON public.bookings;
CREATE POLICY "bookings readable by owner or admin" ON public.bookings FOR SELECT TO authenticated
USING (auth.uid() = requested_by OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
CREATE POLICY "profiles readable by owner or admin" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "classes admin write" ON public.classes;
CREATE POLICY "classes admin write" ON public.classes FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "rooms admin write" ON public.rooms;
CREATE POLICY "rooms admin write" ON public.rooms FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "schedules admin write" ON public.schedules;
CREATE POLICY "schedules admin write" ON public.schedules FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "teachers admin write" ON public.teachers;
CREATE POLICY "teachers admin write" ON public.teachers FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "runs admin insert" ON public.schedule_runs;
CREATE POLICY "runs admin insert" ON public.schedule_runs FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Role claiming moves server-side; no client-callable definer function
DROP FUNCTION IF EXISTS public.claim_role(public.app_role);

CREATE OR REPLACE FUNCTION private.claim_role(_user_id uuid, _role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  granted public.app_role;
BEGIN
  SELECT role INTO granted FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  IF granted IS NOT NULL THEN
    RETURN granted;
  END IF;

  IF _role = 'admin' AND EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    _role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN _role;
END;
$$;
REVOKE ALL ON FUNCTION private.claim_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.claim_role(uuid, public.app_role) TO service_role;

-- Teachers: hide email column from general authenticated reads
REVOKE SELECT ON public.teachers FROM authenticated;
GRANT SELECT (id, name, subject, years_handled, created_at) ON public.teachers TO authenticated;
