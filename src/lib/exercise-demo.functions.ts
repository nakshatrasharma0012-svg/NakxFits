import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";
const TEXT_MODEL = "google/gemini-2.5-flash";

async function callGateway(body: unknown, modalities?: string[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const payload = modalities
    ? { ...(body as object), modalities }
    : (body as object);
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("AI rate limit — try again shortly.");
    if (res.status === 402)
      throw new Error("AI credits exhausted. Add credits in Settings → Workspace.");
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Get (or generate + cache) a visual demo for an exercise.
 * Returns image data URL + step-by-step instructions.
 */
export const getExerciseDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const key = data.name.trim().toLowerCase();

    // Check cache
    const { data: cached } = await supabase
      .from("exercise_demos")
      .select("image_data_url, instructions")
      .eq("exercise_key", key)
      .maybeSingle();
    if (cached?.image_data_url && cached?.instructions) {
      return {
        image: cached.image_data_url,
        instructions: cached.instructions,
        cached: true,
      };
    }

    // Generate instructions
    const textJson = await callGateway({
      model: TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: `Give clear, beginner-friendly form cues for the exercise "${data.name}". Return 4-6 short numbered steps, each under 18 words. No intro, no outro.`,
        },
      ],
    });
    const instructions: string =
      textJson?.choices?.[0]?.message?.content?.toString().trim() ??
      "1. Maintain good form.\n2. Move slowly and controlled.";

    // Generate demo image
    let imageDataUrl = "";
    try {
      const imgJson = await callGateway(
        {
          model: IMAGE_MODEL,
          messages: [
            {
              role: "user",
              content: `A clean, illustrated infographic showing the "${data.name}" exercise. Single athletic figure on a plain background, dynamic motion lines indicating movement, energetic orange and white color scheme, fitness app diagram style.`,
            },
          ],
        },
        ["image", "text"],
      );
      const msg = imgJson?.choices?.[0]?.message;
      const fromImages = msg?.images?.[0]?.image_url?.url;
      const fromContent = Array.isArray(msg?.content)
        ? msg.content.find((c: { type?: string }) => c?.type === "image_url")
            ?.image_url?.url
        : undefined;
      imageDataUrl = fromImages ?? fromContent ?? "";
    } catch (e) {
      // image is non-critical — fall through with instructions only
      console.error("demo image gen failed", e);
    }

    // Upsert into cache (uses authenticated client; RLS allows insert via service role only,
    // so use a direct insert via the auth client — if blocked we still return to the user)
    if (imageDataUrl) {
      try {
        await supabaseAdmin.from("exercise_demos").upsert(
          {
            exercise_key: key,
            image_data_url: imageDataUrl,
            instructions,
          },
          { onConflict: "exercise_key" },
        );
      } catch (e) {
        console.error("demo cache write failed", e);
      }
    }

    return { image: imageDataUrl, instructions, cached: false };
  });
