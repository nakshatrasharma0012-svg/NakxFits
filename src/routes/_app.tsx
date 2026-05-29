import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Home, Dumbbell, Apple, BarChart3, Sparkles, Loader2, User } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const TABS = [
  { to: "/today", label: "Today", Icon: Home },
  { to: "/workouts", label: "Workouts", Icon: Dumbbell },
  { to: "/diet", label: "Diet", Icon: Apple },
  { to: "/progress", label: "Progress", Icon: BarChart3 },
  { to: "/coach", label: "Coach", Icon: Sparkles },
] as const;

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [checking, setChecking] = useState(true);

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
      if (!data?.onboarded) navigate({ to: "/onboarding" });
      else setChecking(false);
    })();
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Link
        to="/profile"
        aria-label="Profile"
        className={`fixed top-3 right-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card/90 backdrop-blur shadow-sm transition hover:bg-muted ${
          loc.pathname === "/profile" ? "text-primary border-primary" : "text-foreground"
        }`}
      >
        <User className="h-5 w-5" />
      </Link>
      <Outlet />
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-md grid grid-cols-5">
          {TABS.map(({ to, label, Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
