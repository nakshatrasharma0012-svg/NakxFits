-- Cache AI-generated exercise demonstration images & instructions
CREATE TABLE public.exercise_demos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_key text NOT NULL UNIQUE,
  image_data_url text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_demos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demos readable by authenticated"
ON public.exercise_demos FOR SELECT
TO authenticated USING (true);

-- inserts/updates only via server function (service role)

-- User-defined home workout plans (custom routines)
CREATE TABLE public.custom_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own custom workouts all"
ON public.custom_workouts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
