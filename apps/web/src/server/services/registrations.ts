import { prisma, type Event, type Prisma, type RegistrationStatus } from "@club/db";
import { UserError } from "../errors";

type Tx = Prisma.TransactionClient;

export function isRegistrationOpen(event: Pick<Event, "status" | "registrationDeadline">, now = new Date()) {
  return event.status === "OPEN" && now < event.registrationDeadline;
}

/** Locks the event row so two people cannot take the last spot at the same time. */
async function lockEvent(tx: Tx, eventId: string) {
  await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
  const event = await tx.event.findUnique({ where: { id: eventId } });
  if (!event) throw new UserError("Event not found");
  return event;
}

/** Moves waitlisted players into free spots, first come first served. */
export async function fillFromWaitlist(tx: Tx, eventId: string) {
  const event = await lockEvent(tx, eventId);
  const confirmed = await tx.registration.count({ where: { eventId, status: "CONFIRMED" } });
  const free = event.maxPlayers - confirmed;
  if (free <= 0) return 0;
  const next = await tx.registration.findMany({
    where: { eventId, status: "WAITLISTED" },
    orderBy: { registeredAt: "asc" },
    take: free,
  });
  if (next.length) {
    await tx.registration.updateMany({ where: { id: { in: next.map((r) => r.id) } }, data: { status: "CONFIRMED" } });
  }
  return next.length;
}

export async function registerForEvent(userId: string, eventId: string): Promise<RegistrationStatus> {
  return prisma.$transaction(async (tx) => {
    const event = await lockEvent(tx, eventId);
    if (!isRegistrationOpen(event)) throw new UserError("Registration is closed for this event");

    const existing = await tx.registration.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (existing && existing.status !== "CANCELLED") throw new UserError("You are already registered");

    const confirmed = await tx.registration.count({ where: { eventId, status: "CONFIRMED" } });
    const status: RegistrationStatus = confirmed < event.maxPlayers ? "CONFIRMED" : "WAITLISTED";
    const data = { status, registeredAt: new Date(), cancelledAt: null, checkedInAt: null };
    await tx.registration.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: data,
      create: { eventId, userId, ...data },
    });
    return status;
  });
}

export async function cancelRegistration(userId: string, eventId: string) {
  await prisma.$transaction(async (tx) => {
    const event = await lockEvent(tx, eventId);
    if (!isRegistrationOpen(event)) throw new UserError("The deadline has passed. Ask an admin to remove you.");
    const reg = await tx.registration.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (!reg || reg.status === "CANCELLED") throw new UserError("You are not registered");
    await tx.registration.update({ where: { id: reg.id }, data: { status: "CANCELLED", cancelledAt: new Date(), checkedInAt: null } });
    if (reg.status === "CONFIRMED") await fillFromWaitlist(tx, eventId);
  });
}

/** Admin: adds a member as confirmed, ignoring the deadline and the player limit. */
export async function adminAddRegistration(eventId: string, userId: string) {
  const data = { status: "CONFIRMED" as const, registeredAt: new Date(), cancelledAt: null };
  await prisma.registration.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: data,
    create: { eventId, userId, ...data },
  });
}

export async function adminRemoveRegistration(registrationId: string) {
  await prisma.$transaction(async (tx) => {
    const reg = await tx.registration.findUnique({ where: { id: registrationId } });
    if (!reg) throw new UserError("Registration not found");
    await tx.registration.update({
      where: { id: reg.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), checkedInAt: null },
    });
    if (reg.status === "CONFIRMED") await fillFromWaitlist(tx, reg.eventId);
  });
}

export async function adminConfirmRegistration(registrationId: string) {
  await prisma.registration.update({ where: { id: registrationId }, data: { status: "CONFIRMED", cancelledAt: null } });
}

export async function setCheckIn(registrationId: string, checkedIn: boolean) {
  const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!reg || reg.status !== "CONFIRMED") throw new UserError("Only confirmed players can be checked in");
  await prisma.registration.update({ where: { id: registrationId }, data: { checkedInAt: checkedIn ? new Date() : null } });
}
