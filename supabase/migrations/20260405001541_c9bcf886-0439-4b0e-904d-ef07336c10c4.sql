
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id uuid,
  phone text,
  total_earned bigint,
  surveys_completed bigint,
  referral_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    CONCAT(LEFT(p.phone, 6), '****', RIGHT(p.phone, 2)) AS phone,
    COALESCE(SUM(sc.amount), 0)::bigint AS total_earned,
    COUNT(sc.id)::bigint AS surveys_completed,
    p.referral_count
  FROM profiles p
  LEFT JOIN survey_completions sc ON sc.user_id = p.id
  WHERE p.is_paid = true
  GROUP BY p.id, p.phone, p.referral_count
  ORDER BY total_earned DESC, surveys_completed DESC
  LIMIT 20;
$$;
