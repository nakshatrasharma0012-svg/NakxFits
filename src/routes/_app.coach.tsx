import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { chatCoach } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/coach")({
  component: Coach,
  head: () => ({
    meta: [
      { title: "AI Coach — NAKX FITS" },
      {
        name: "description",
        content:
          "Chat with the NAKX FITS AI coach for personalized workout plans, meal ideas, and form tips based on your goals.",
      },
      { property: "og:title", content: "AI Coach — NAKX FITS" },
      {
        property: "og:description",
        content: "Get personalized workout, nutrition, and form advice from your AI coach.",
      },
      { property: "og:url", content: "https://build-a-dream-08.lovable.app/coach" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://build-a-dream-08.lovable.app/coach" },
    ],
  }),
});

const SUGGESTIONS = [
  "Build me a 4-day push/pull split",
  "Suggest a 1800-kcal high-protein veg day",
  "How do I break a weight-loss plateau?",
  "Best post-workout meal under 500 kcal?",
];

function Coach() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const chat = useServerFn(chatCoach);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["ai-messages"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at")
        .limit(100);
      return data ?? [];
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setInput("");
    try {
      await chat({ data: { message: text } });
      qc.invalidateQueries({ queryKey: ["ai-messages"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>
      <PageHeader title="AI Coach" subtitle="Plans, tips & answers" />

      <div className="flex-1 px-4 space-y-3 pb-4">
        {(messages?.length ?? 0) === 0 && (
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <p className="font-semibold text-sm">Welcome to your coach</p>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Ask me anything about workouts, nutrition, or your goals.
            </p>
            <div className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm rounded-xl border border-border bg-background px-3 py-2 hover:border-primary transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages?.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border bg-card px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-20 z-30 px-4 pb-2 pt-2 bg-gradient-to-t from-background via-background to-transparent">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ask your coach…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || !input.trim()}
            size="icon"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
