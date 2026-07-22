import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getMyProfile } from "@/lib/profile.functions";
import { PageHeader, Section, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";
import { LogOut, Sun, Moon, Monitor, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — NAKX FITS" },
      {
        name: "description",
        content:
          "Edit your name, body metrics, and theme preferences, or sign out of your NAKX FITS account.",
      },
      { property: "og:title", content: "Profile — NAKX FITS" },
      {
        property: "og:description",
        content: "Manage your account, body metrics, and appearance preferences.",
      },
      { property: "og:url", content: "https://build-a-dream-08.lovable.app/profile" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://build-a-dream-08.lovable.app/profile" },
    ],
  }),
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const { theme, setTheme } = useTheme();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [form, setForm] = useState({
    name: "",
    age: "",
    height_cm: "",
    weight_kg: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        age: profile.age?.toString() ?? "",
        height_cm: profile.height_cm?.toString() ?? "",
        weight_kg: profile.weight_kg?.toString() ?? "",
      });
    }
  }, [profile]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: form.name,
          age: form.age ? Number(form.age) : null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  const initials = (form.name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account & preferences" />
      <Section>
        <Card className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{form.name || "Your name"}</div>
            <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
          </div>
        </Card>
      </Section>

      <Section>
        <Card>
          <h2 className="font-semibold mb-3">Account details</h2>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={onSave} className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={form.height_cm}
                    onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={form.weight_kg}
                    onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </form>
          )}
        </Card>
      </Section>

      <Section>
        <Card>
          <h2 className="font-semibold mb-3">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "light", label: "Light", Icon: Sun },
              { v: "dark", label: "Dark", Icon: Moon },
              { v: "system", label: "System", Icon: Monitor },
            ].map(({ v, label, Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => setTheme(v as "light" | "dark" | "system")}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition ${
                  theme === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </Card>
      </Section>

      <Section>
        <Button variant="destructive" className="w-full" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </Section>
    </div>
  );
}
