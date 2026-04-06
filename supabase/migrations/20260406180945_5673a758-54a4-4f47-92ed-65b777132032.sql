
-- 1. Prevent users from updating sensitive profile fields (balance, is_paid, referral_count, referrer_id, referral_code)
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the user is not an admin, prevent changes to sensitive fields
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.balance := OLD.balance;
    NEW.is_paid := OLD.is_paid;
    NEW.referral_count := OLD.referral_count;
    NEW.referrer_id := OLD.referrer_id;
    NEW.referral_code := OLD.referral_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_sensitive_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_sensitive_profile_update();

-- 2. Force survey_completions amount to the default (50) on insert, preventing client-supplied arbitrary amounts
CREATE OR REPLACE FUNCTION public.enforce_survey_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always set amount to the fixed reward value
  NEW.amount := 50;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_survey_amount
  BEFORE INSERT ON public.survey_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_survey_amount();

-- 3. Fix user_roles privilege escalation: drop the ALL policy and replace with explicit per-command policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
