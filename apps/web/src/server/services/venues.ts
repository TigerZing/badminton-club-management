import { prisma } from "@club/db";
import { clubDayRange, fromClubTime } from "@/lib/time";
import { UserError } from "../errors";

export function listVenues({ activeOnly }: { activeOnly: boolean }) {
  return prisma.venue.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { courts: true } },
      crawlRuns: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  });
}

export function getVenue(id: string) {
  return prisma.venue.findUnique({
    where: { id },
    include: {
      courts: { orderBy: { name: "asc" } },
      slots: { where: { endsAt: { gte: new Date() } }, orderBy: [{ startsAt: "asc" }, { courtLabel: "asc" }], take: 100 },
      crawlRuns: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });
}

export interface VenueInput {
  id?: string | null;
  name: string;
  address?: string | null;
  mapUrl?: string | null;
  bookingUrl?: string | null;
  crawlerKey?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  bookingInfo?: string | null;
  isActive: boolean;
}

export function saveVenue({ id, name, isActive, ...optional }: VenueInput) {
  const clean = {
    name,
    isActive,
    address: optional.address ?? null,
    mapUrl: optional.mapUrl ?? null,
    bookingUrl: optional.bookingUrl ?? null,
    crawlerKey: optional.crawlerKey ?? null,
    phone: optional.phone ?? null,
    website: optional.website ?? null,
    description: optional.description ?? null,
    bookingInfo: optional.bookingInfo ?? null,
  };
  return id ? prisma.venue.update({ where: { id }, data: clean }) : prisma.venue.create({ data: clean });
}

export async function addCourt(venueId: string, name: string) {
  const exists = await prisma.court.findUnique({ where: { venueId_name: { venueId, name } } });
  if (exists) throw new UserError("errors.courtNameTaken");
  await prisma.court.create({ data: { venueId, name } });
}

export async function deleteCourt(courtId: string) {
  await prisma.court.delete({ where: { id: courtId } });
}

export async function addManualSlot(input: {
  venueId: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  price?: number;
}) {
  const court = await prisma.court.findUnique({ where: { id: input.courtId } });
  if (!court || court.venueId !== input.venueId) throw new UserError("errors.pickCourtAtVenue");
  const startsAt = fromClubTime(input.date, input.startTime);
  const endsAt = fromClubTime(input.date, input.endTime);
  const data = { courtId: court.id, endsAt, price: input.price ?? null, status: "AVAILABLE" as const, source: "MANUAL" as const, fetchedAt: new Date() };
  await prisma.courtSlot.upsert({
    where: { venueId_courtLabel_startsAt: { venueId: input.venueId, courtLabel: court.name, startsAt } },
    update: data,
    create: { venueId: input.venueId, courtLabel: court.name, startsAt, ...data },
  });
}

export async function deleteSlot(slotId: string) {
  await prisma.courtSlot.delete({ where: { id: slotId } });
}

/** Free slots for one club-time day, grouped by venue, read only from the database cache. */
export async function getAvailability(date: string, venueId?: string) {
  const { start, end } = clubDayRange(date);
  const venues = await prisma.venue.findMany({
    where: { isActive: true, ...(venueId ? { id: venueId } : {}) },
    orderBy: { name: "asc" },
    include: {
      slots: {
        where: { status: "AVAILABLE", startsAt: { gte: start, lt: end }, endsAt: { gt: new Date() } },
        orderBy: [{ startsAt: "asc" }, { courtLabel: "asc" }],
      },
      crawlRuns: { where: { status: "OK" }, orderBy: { finishedAt: "desc" }, take: 1 },
    },
  });
  return venues.map(({ crawlRuns, ...v }) => ({
    ...v,
    lastUpdated: crawlRuns[0]?.finishedAt ?? v.slots.reduce<Date | null>((d, s) => (!d || s.fetchedAt > d ? s.fetchedAt : d), null),
  }));
}

/** Starts the crawl workflow on GitHub Actions. Needs GITHUB_TOKEN and GITHUB_REPO. */
export async function triggerCrawl(venueId?: string) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) throw new UserError("errors.crawlNotSetUp");
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/crawl.yml/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({ ref: "main", inputs: venueId ? { venueId } : {} }),
  });
  if (!res.ok) throw new UserError("errors.crawlRefused", { status: res.status });
}
