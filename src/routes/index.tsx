import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
  head: () => ({
    meta: [
      { title: "NAKX FITS — AI Fitness & Nutrition Coach" },
      {
        name: "description",
        content:
          "NAKX FITS is your all-in-one fitness app: gym and home workouts, AI photo meal tracking, and a personal AI coach.",
      },
      { property: "og:title", content: "NAKX FITS — AI Fitness & Nutrition Coach" },
      {
        property: "og:description",
        content:
          "Track workouts, scan meals with AI, and get personalized coaching in one app.",
      },
      { property: "og:url", content: "https://build-a-dream-08.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://build-a-dream-08.lovable.app/" },
    ],
  }),
});

function IndexRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .maybeSingle();
      navigate({ to: data?.onboarded ? "/today" : "/onboarding" });
    })();
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
