ALTER TABLE public.workout_sets ALTER COLUMN exercise_id DROP NOT NULL;
ALTER TABLE public.workout_sets ADD COLUMN IF NOT EXISTS exercise_name text;
