CREATE OR REPLACE FUNCTION public.claim_role(_role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  granted public.app_role;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO granted FROM public.user_roles WHERE user_id = uid LIMIT 1;
  IF granted IS NOT NULL THEN
    RETURN granted;
  END IF;

  IF _role = 'admin' AND EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    _role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN _role;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_role(public.app_role) TO authenticated;