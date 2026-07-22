import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";
import { PageHeader, Section, Card } from "@/components/app-shell";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import { Flame, Beef, Wheat, Droplet, Plus, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/today")({
  component: Today,
  head: () => ({
    meta: [
      { title: "Your Daily Dashboard — NAKX FITS" },
      {
        name: "description",
        content:
          "See today's calories, macros, and workout progress at a glance and log meals or training in one tap.",
      },
      { property: "og:title", content: "Your Daily Dashboard — NAKX FITS" },
      {
        property: "og:description",
        content: "Track today's calories, macros, and training progress in one place.",
      },
      { property: "og:url", content: "https://build-a-dream-08.lovable.app/today" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://build-a-dream-08.lovable.app/today" },
    ],
  }),
});

function Today() {
  const { user } = useAuth();
  const fetchProfile = useServerFn(getMyProfile);
  const today = new Date().toISOString().slice(0, 10);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const { data: meals } = useQuery({
    queryKey: ["meals", today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("meal_entries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today);
      return data ?? [];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_sessions")
        .select("*, workout_sets(*)")
        .eq("user_id", user!.id)
        .eq("date", today);
      return data ?? [];
    },
  });

  const totals = (meals ?? []).reduce(
    (a, m) => ({
      kcal: a.kcal + Number(m.kcal || 0),
      protein: a.protein + Number(m.protein_g || 0),
      carbs: a.carbs + Number(m.carbs_g || 0),
      fat: a.fat + Number(m.fat_g || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const tKcal = profile?.daily_kcal ?? 2000;
  const tP = profile?.protein_g ?? 120;
  const tC = profile?.carbs_g ?? 220;
  const tF = profile?.fat_g ?? 60;

  return (
    <div>
      <PageHeader
        title="Your Daily Dashboard"
        subtitle={`Hi ${profile?.name ?? "there"} · ${new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}`}
      />

      <Section>
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Calories today</p>
              <p className="text-3xl font-bold mt-1">
                {Math.round(totals.kcal)}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  / {tKcal}
                </span>
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Flame className="h-7 w-7 text-primary" />
            </div>
          </div>
          <Progress value={Math.min(100, (totals.kcal / tKcal) * 100)} className="mt-3 h-2" />
        </Card>
      </Section>

      <Section>
        <div className="grid grid-cols-3 gap-2">
          <MacroCard
            icon={<Beef className="h-4 w-4" />}
            label="Protein"
            value={totals.protein}
            target={tP}
            color="bg-primary"
          />
          <MacroCard
            icon={<Wheat className="h-4 w-4" />}
            label="Carbs"
            value={totals.carbs}
            target={tC}
            color="bg-chart-3"
          />
          <MacroCard
            icon={<Droplet className="h-4 w-4" />}
            label="Fat"
            value={totals.fat}
            target={tF}
            color="bg-chart-4"
          />
        </div>
      </Section>

      <Section>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Dumbbell className="h-4 w-4" /> Today's training
            </h2>
            <Link to="/workouts">
              <Button size="sm" variant="ghost">
                Open
              </Button>
            </Link>
          </div>
          {(sessions?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workout logged yet. Tap Workouts to start one.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions!.map((s) => (
                <li key={s.id} className="text-sm">
                  <span className="font-medium capitalize">{s.mode}</span> · {s.workout_sets?.length ?? 0} sets
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Section>

      <Section>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/diet" className="block">
            <Card className="hover:bg-accent/10 transition">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Log a meal</p>
                  <p className="text-xs text-muted-foreground">Search or AI photo</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to="/coach" className="block">
            <Card className="hover:bg-accent/10 transition">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-sm">Ask coach</p>
                  <p className="text-xs text-muted-foreground">Plans & tips</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </Section>
    </div>
  );
}

function MacroCard({
  icon,
  label,
  value,
  target,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, (value / Math.max(1, target)) * 100);
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold leading-none">
        {Math.round(value)}
        <span className="text-xs font-normal text-muted-foreground">/{target}g</span>
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
