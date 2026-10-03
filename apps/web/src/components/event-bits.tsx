import type { EventStatus, RegistrationStatus } from "@club/db";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";

const EVENT_STATUS = {
  DRAFT: { label: "status.draft", variant: "muted" },
  OPEN: { label: "status.open", variant: "success" },
  CLOSED: { label: "status.closed", variant: "muted" },
  IN_PROGRESS: { label: "status.inProgress", variant: "default" },
  COMPLETED: { label: "status.completed", variant: "muted" },
  CANCELLED: { label: "status.cancelled", variant: "destructive" },
} as const satisfies Record<EventStatus, { label: string; variant: string }>;

export async function EventStatusBadge({ status }: { status: EventStatus }) {
  const { t } = await getT();
  const s = EVENT_STATUS[status];
  return <Badge variant={s.variant}>{t(s.label)}</Badge>;
}

export async function MyStatusBadge({ status }: { status: RegistrationStatus | null }) {
  const { t } = await getT();
  if (status === "CONFIRMED") return <Badge variant="success">{t("status.youreIn")}</Badge>;
  if (status === "WAITLISTED") return <Badge variant="warning">{t("status.waitlisted")}</Badge>;
  return null;
}

export function SkillDot({ level }: { level: number }) {
  return (
    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
      {level}
    </span>
  );
}
