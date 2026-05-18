# FitFuel — Fitness & Diet Tracker (v1)

A mobile-first PWA where one user tracks both workouts and nutrition, with a personal AI coach that builds plans and analyzes meal photos.

## Tech & Infrastructure
- **Frontend:** TanStack Start + Tailwind + shadcn/ui, mobile-first responsive UI, auto light/dark mode matching device setting.
- **Backend:** Lovable Cloud (Postgres + Auth + Storage + server functions).
- **AI:** Lovable AI Gateway (Gemini 3 Flash for chat & meal estimation; Gemini 2.5 Pro for vision on meal photos).
- **Auth (v1):** Email/password, Google sign-in, Phone (SMS OTP). Facebook is **not natively supported** — flagged for v2 via custom Supabase OAuth setup.

## User Flow

```text
Sign up → Onboarding (name, age, gender, height, weight, body type,
          activity level, goal: lose / maintain / gain, target muscles)
        → Auto-computes daily calorie + macro targets (Mifflin-St Jeor)
        → Home Dashboard
```

**Home Dashboard tabs (bottom nav):**
1. **Today** — calories ring + macro bars + today's workout + quick actions
2. **Workouts** — Gym / Home toggle, routines, exercise library, log session
3. **Diet** — meal log (breakfast/lunch/dinner/snacks), add food, photo scan
4. **Progress** — weight chart, strength PRs, calorie/macro adherence, streaks
5. **Coach** — AI chat assistant

## Feature Breakdown

### 1. Onboarding
- Multi-step form storing into `profiles`: name, age, gender, height (cm/ft), weight, body type (ectomorph/mesomorph/endomorph), activity level, goal, target muscle groups (chest, back, legs, arms, shoulders, core).
- Computes BMR + TDEE → daily calorie target → macro split (protein 30 / carbs 40 / fat 30 by default, tunable).

### 2. Workouts
- **Two modes:** Gym (equipment) and Home (bodyweight + optional dumbbells).
- Seeded exercise library (~80 exercises) tagged by muscle group, equipment, difficulty, with form tips.
- AI generates a personalized weekly routine based on target muscles + mode.
- Workout session screen: log sets × reps × weight per exercise, rest timer.
- History + PR tracking per exercise.

### 3. Diet Tracker
- **Add food** three ways:
  1. Search seeded food database (~300 common veg + non-veg items with full macros).
  2. Manual entry (name, serving, kcal, P/C/F).
  3. **AI photo scan** — upload meal photo, Gemini vision returns estimated items + calories + protein/carbs/fat/fiber; user confirms/edits before saving.
- Meals grouped by breakfast/lunch/dinner/snack with running daily totals vs. targets.

### 4. Progress
- Body weight log + line chart.
- Workout volume per muscle group over time.
- Calorie/macro adherence (% of days on target).
- Streak counter.

### 5. AI Coach
- Chat assistant with context on the user's profile, recent workouts, and recent meals.
- Two key skills: "Generate me a diet plan for this week" and "Adjust my workout plan."
- Streamed responses via AI SDK + Lovable AI Gateway server route.

### 6. Theme
- `prefers-color-scheme` media query drives default light/dark; user can override in settings.

## Database (Lovable Cloud)

```text
profiles            (id, name, age, gender, height_cm, weight_kg, body_type,
                     activity_level, goal, target_muscles[], daily_kcal,
                     protein_g, carbs_g, fat_g, theme_pref)
exercises           (id, name, muscle_group, equipment, mode, instructions)
routines            (id, user_id, name, mode, days_per_week)
routine_exercises   (routine_id, exercise_id, day, target_sets, target_reps)
workout_sessions    (id, user_id, date, mode, notes)
workout_sets        (id, session_id, exercise_id, set_no, reps, weight_kg)
foods               (id, name, serving_g, kcal, protein_g, carbs_g, fat_g,
                     fiber_g, is_veg, is_custom, user_id nullable)
meal_entries        (id, user_id, date, meal_type, food_id, servings, source)
weight_logs         (id, user_id, date, weight_kg)
ai_messages         (id, user_id, role, content, created_at)
```

All tables: RLS enabled, user-scoped policies via `auth.uid()`. User roles stored in a separate `user_roles` table (admin role reserved for future moderation).

## Storage
- `meal-photos` bucket (private, RLS by user) for AI photo-scan uploads.
- `avatars` bucket (public) for profile pictures.

## Deployment
Built-in: click **Publish** when ready. Stable URLs auto-provisioned. Custom domain available after first publish.

## Out of Scope for v1 (can add next)
- Facebook login (needs custom Supabase OAuth).
- Wearable integration (Apple Health / Google Fit).
- Social feed / friends.
- Barcode food scanner.
- Native iOS/Android wrapper (currently a mobile-optimized web app / installable PWA).

## Build Order
1. Enable Lovable Cloud + schema + RLS.
2. Auth (Email + Google + Phone) + onboarding flow + profile.
3. Seed exercise + food libraries.
4. Workouts module (routine + session logging).
5. Diet module (search + manual + AI photo scan).
6. Progress dashboard + charts.
7. AI Coach chat.
8. Theme + polish + publish.
