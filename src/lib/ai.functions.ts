import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const VISION_MODEL = "google/gemini-2.5-pro";

async function callAI(body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached, please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace.");
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

/** Conversational coach */
export const chatCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ message: z.string().min(1).max(2000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // load profile + recent context
    const [{ data: profile }, { data: recentMeals }, { data: recentSessions }, { data: history }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("meal_entries")
          .select("food_name,kcal,protein_g,date,meal_type")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("workout_sessions")
          .select("date,mode,notes")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(5),
        supabase
          .from("ai_messages")
          .select("role,content")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(20),
      ]);

    const system = `You are NAKX Coach, a concise, motivating personal trainer and nutritionist.
User profile: ${JSON.stringify(profile)}
Recent meals (last 15): ${JSON.stringify(recentMeals ?? [])}
Recent workouts: ${JSON.stringify(recentSessions ?? [])}
Rules:
- Be direct, encouraging, and specific. Use bullet points when listing.
- Tailor advice to the user's goal, body type, preferred workout mode, and target muscles.
- Suggest realistic, evidence-based macros and exercises. If the user asks for a meal/workout plan, output a clear schedule.`;

    const messages = [
      { role: "system", content: system },
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    // save user message
    await supabase.from("ai_messages").insert({
      user_id: userId,
      role: "user",
      content: data.message,
    });

    const json = await callAI({ model: MODEL, messages });
    const reply: string =
      json?.choices?.[0]?.message?.content?.toString() ?? "Sorry, no reply.";

    await supabase.from("ai_messages").insert({
      user_id: userId,
      role: "assistant",
      content: reply,
    });

    return { reply };
  });

export const getCoachHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("ai_messages")
      .select("id,role,content,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100);
    return data ?? [];
  });

/** Analyze a meal photo (data URL) and return estimated macros */
export const analyzeMealPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        imageDataUrl: z.string().startsWith("data:image/"),
        note: z.string().max(300).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const prompt = `You are a nutritionist. Identify each food in this meal photo and estimate macros.
Return STRICT JSON only, no prose:
{"meal_name": string, "items": [{"name": string, "servings": number, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number}], "total": {"kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number}}
User note: ${data.note ?? "none"}`;

    const json = await callAI({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
    });
    const raw: string = json?.choices?.[0]?.message?.content?.toString() ?? "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error("AI returned unparseable response. Try a clearer photo.");
    }
  });

/** Estimate macros for a text description */
export const estimateMealText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ description: z.string().min(2).max(300) }).parse(i),
  )
  .handler(async ({ data }) => {
    const prompt = `Estimate macros for: "${data.description}".
Return STRICT JSON only:
{"name": string, "servings": 1, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number}`;
    const json = await callAI({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    const raw: string = json?.choices?.[0]?.message?.content?.toString() ?? "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error("AI returned unparseable response.");
    }
  });
