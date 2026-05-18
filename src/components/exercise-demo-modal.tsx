import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getExerciseDemo } from "@/lib/exercise-demo.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Info } from "lucide-react";

export function ExerciseDemoModal({
  name,
  open,
  onOpenChange,
}: {
  name: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const fetchDemo = useServerFn(getExerciseDemo);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["exercise-demo", name.toLowerCase()],
    enabled: open && !!name,
    staleTime: 1000 * 60 * 60 * 24,
    queryFn: () => fetchDemo({ data: { name } }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> {name}
          </DialogTitle>
        </DialogHeader>
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Generating demo… this can take 10–15s first time.
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive py-4">
            {error instanceof Error ? error.message : "Couldn't load demo."}
          </p>
        )}
        {data && (
          <div className="space-y-3">
            {data.image ? (
              <img
                src={data.image}
                alt={`${name} demonstration`}
                className="w-full rounded-xl border bg-muted"
                loading="lazy"
              />
            ) : (
              <div className="rounded-xl border bg-muted aspect-video flex items-center justify-center text-xs text-muted-foreground">
                Visual unavailable — see steps below.
              </div>
            )}
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {data.instructions}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
