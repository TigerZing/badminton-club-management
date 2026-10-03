import type { EventStatus, RegistrationStatus } from "@club/db";
import { Badge } from "@/components/ui/badge";

const EVENT_STATUS: Record<EventStatus, { label: string; variant: "default" | "muted" | "success" | "warning" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "muted" },
  OPEN: { label: "Open", variant: "success" },
  CLOSED: { label: "Registration closed", variant: "muted" },
  IN_PROGRESS: { label: "Playing now", variant: "default" },
  COMPLETED: { label: "Completed", variant: "muted" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const s = EVENT_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function MyStatusBadge({ status }: { status: RegistrationStatus | null }) {
  if (status === "CONFIRMED") return <Badge variant="success">You&apos;re in</Badge>;
  if (status === "WAITLISTED") return <Badge variant="warning">Waitlisted</Badge>;
  return null;
}

export function SkillDot({ level }: { level: number }) {
  return (
    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
      {level}
    </span>
  );
}
