import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="px-4 pt-6 pb-3 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("px-4 pb-4", className)}>{children}</section>;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-sm", className)}>{children}</div>
  );
}
