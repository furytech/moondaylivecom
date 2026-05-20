CREATE TABLE public.moon_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_at timestamptz NOT NULL UNIQUE,
  from_sign text NOT NULL,
  to_sign text NOT NULL,
  transition_date date GENERATED ALWAYS AS ((transition_at AT TIME ZONE 'UTC')::date) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_moon_transitions_date ON public.moon_transitions(transition_date);
CREATE INDEX idx_moon_transitions_at ON public.moon_transitions(transition_at);

ALTER TABLE public.moon_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read moon transitions"
  ON public.moon_transitions
  FOR SELECT
  TO public
  USING (true);