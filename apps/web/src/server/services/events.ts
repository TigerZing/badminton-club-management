import { prisma, type EventStatus } from "@club/db";
import { fromClubTime } from "@/lib/time";
import { UserError } from "../errors";
import { fillFromWaitlist } from "./registrations";

export interface EventInput {
  title: string;
  venueId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  courtCount: number;
  maxPlayers: number;
  deadlineDate: string;
  deadlineTime: string;
  notes?: string | null;
}

function toEventData(input: EventInput) {
  const startsAt = fromClubTime(input.date, input.startTime);
  const endsAt = fromClubTime(input.date, input.endTime);
  const registrationDeadline = fromClubTime(input.deadlineDate, input.deadlineTime);
  if (registrationDeadline > startsAt) throw new UserError("errors.deadlineBeforeStart");
  return {
    title: input.title,
    venueId: input.venueId || null,
    startsAt,
    endsAt,
    registrationDeadline,
    courtCount: input.courtCount,
    maxPlayers: input.maxPlayers,
    notes: input.notes ?? null,
  };
}

export function createEvent(input: EventInput, createdById: string) {
  return prisma.event.create({ data: { ...toEventData(input), createdById } });
}

export async function updateEvent(eventId: string, input: EventInput) {
  await prisma.$transaction(async (tx) => {
    await tx.event.update({ where: { id: eventId }, data: toEventData(input) });
    await fillFromWaitlist(tx, eventId);
  });
}

const TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["CLOSED", "IN_PROGRESS", "CANCELLED", "DRAFT"],
  CLOSED: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CLOSED"],
  COMPLETED: ["IN_PROGRESS"],
  CANCELLED: ["DRAFT"],
};

export function allowedTransitions(status: EventStatus) {
  return TRANSITIONS[status];
}

export async function setEventStatus(eventId: string, status: EventStatus) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new UserError("errors.eventNotFound");
  if (!TRANSITIONS[event.status].includes(status)) {
    throw new UserError("errors.cannotChangeStatus", { from: event.status, to: status });
  }
  await prisma.event.update({ where: { id: eventId }, data: { status } });
}

/** Events members can see: published and not finished more than a day ago. */
export async function listUpcomingEvents(userId: string) {
  const since = new Date(Date.now() - 24 * 3600_000);
  const events = await prisma.event.findMany({
    where: { status: { in: ["OPEN", "CLOSED", "IN_PROGRESS"] }, endsAt: { gte: since } },
    orderBy: { startsAt: "asc" },
    include: {
      venue: true,
      registrations: { where: { status: { not: "CANCELLED" } }, select: { userId: true, status: true } },
    },
  });
  return events.map(({ registrations, ...e }) => ({
    ...e,
    confirmedCount: registrations.filter((r) => r.status === "CONFIRMED").length,
    waitlistCount: registrations.filter((r) => r.status === "WAITLISTED").length,
    myStatus: registrations.find((r) => r.userId === userId)?.status ?? null,
  }));
}

export function getEventWithRegistrations(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      venue: true,
      registrations: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { registeredAt: "asc" },
        include: { user: { select: { id: true, name: true, skillLevel: true, email: true } } },
      },
    },
  });
}

export function listEventsForAdmin() {
  return prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      venue: true,
      _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
    },
  });
}
