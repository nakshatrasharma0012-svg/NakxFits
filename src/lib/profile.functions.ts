import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { computeTargets } from "./nutrition";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

const onboardSchema = z.object({
  name: z.string().min(1).max(80),
  age: z.number().int().min(10).max(100),
  gender: z.enum(["male", "female", "other"]),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  body_type: z.enum(["ectomorph", "mesomorph", "endomorph"]),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  target_muscles: z.array(
    z.enum(["chest", "back", "legs", "shoulders", "arms", "core", "full_body", "cardio"]),
  ),
  preferred_mode: z.enum(["gym", "home"]),
});

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => onboardSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const targets = computeTargets({
      gender: data.gender,
      age: data.age,
      height_cm: data.height_cm,
      weight_kg: data.weight_kg,
      activity_level: data.activity_level,
      goal: data.goal,
    });
    const { error } = await supabase
      .from("profiles")
      .update({
        ...data,
        ...targets,
        onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) throw error;

    // seed an initial weight log
    await supabase
      .from("weight_logs")
      .upsert(
        { user_id: userId, weight_kg: data.weight_kg, date: new Date().toISOString().slice(0, 10) },
        { onConflict: "user_id,date" },
      );
    return { ok: true, ...targets };
  });
