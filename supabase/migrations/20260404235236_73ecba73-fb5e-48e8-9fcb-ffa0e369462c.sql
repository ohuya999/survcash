
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active questions
CREATE POLICY "Authenticated users can view active questions" ON public.survey_questions
  FOR SELECT TO authenticated USING (is_active = true);

-- Admins can manage questions
CREATE POLICY "Admins can manage questions" ON public.survey_questions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add a column to survey_completions to store answers
ALTER TABLE public.survey_completions
  ADD COLUMN answers JSONB DEFAULT '[]';
