-- Agency follows: users can follow agencies
CREATE TABLE IF NOT EXISTS public.agency_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, agency_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_follows_user ON public.agency_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_follows_agency ON public.agency_follows(agency_id);

-- RLS
ALTER TABLE public.agency_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can count follows per agency"
  ON public.agency_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow agencies"
  ON public.agency_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow agencies"
  ON public.agency_follows FOR DELETE
  USING (auth.uid() = user_id);
