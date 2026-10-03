import { chromium } from "playwright";
import { prisma } from "@club/db";
import { getAdapter } from "./adapters/index";

const DAYS_AHEAD = 7;

/**
 * Crawls every active venue that has a crawler key (or just VENUE_ID if set),
 * upserts the slots it finds, and marks slots that disappeared as booked.
 * The web app only ever reads these cached rows.
 */
async function main() {
  const venueId = process.env.VENUE_ID || undefined;
  const venues = await prisma.venue.findMany({
    where: { isActive: true, crawlerKey: { not: null }, ...(venueId ? { id: venueId } : {}) },
  });
  if (venues.length === 0) {
    console.log("No venues with a crawler key. Nothing to do.");
    return;
  }

  const browser = await chromium.launch();
  let failures = 0;
  try {
    for (const venue of venues) {
      const run = await prisma.crawlRun.create({ data: { venueId: venue.id } });
      try {
        const adapter = getAdapter(venue.crawlerKey!);
        if (!adapter) throw new Error(`No crawler adapter named "${venue.crawlerKey}"`);

        const from = new Date();
        const to = new Date(from.getTime() + DAYS_AHEAD * 24 * 3600_000);
        const slots = await adapter.fetchSlots({ browser, venue, from, to });
        const fetchedAt = new Date();

        const courts = await prisma.court.findMany({ where: { venueId: venue.id } });
        const courtId = (label: string) => courts.find((c) => c.name === label)?.id ?? null;

        await prisma.$transaction([
          ...slots.map((s) =>
            prisma.courtSlot.upsert({
              where: { venueId_courtLabel_startsAt: { venueId: venue.id, courtLabel: s.courtLabel, startsAt: s.startsAt } },
              update: { endsAt: s.endsAt, status: s.available ? "AVAILABLE" : "BOOKED", price: s.price ?? null, fetchedAt, source: "CRAWLER" },
              create: {
                venueId: venue.id,
                courtId: courtId(s.courtLabel),
                courtLabel: s.courtLabel,
                startsAt: s.startsAt,
                endsAt: s.endsAt,
                status: s.available ? "AVAILABLE" : "BOOKED",
                price: s.price ?? null,
                source: "CRAWLER",
                fetchedAt,
              },
            }),
          ),
          // Crawled slots in the window that the site no longer lists are no longer free.
          prisma.courtSlot.updateMany({
            where: { venueId: venue.id, source: "CRAWLER", startsAt: { gte: from, lt: to }, fetchedAt: { lt: fetchedAt } },
            data: { status: "BOOKED" },
          }),
          prisma.crawlRun.update({
            where: { id: run.id },
            data: { status: "OK", finishedAt: new Date(), slotsFound: slots.filter((s) => s.available).length },
          }),
        ]);
        console.log(`${venue.name}: ${slots.length} slots`);
      } catch (e) {
        failures++;
        const message = e instanceof Error ? e.message : String(e);
        console.error(`${venue.name}: ${message}`);
        await prisma.crawlRun.update({
          where: { id: run.id },
          data: { status: "FAILED", finishedAt: new Date(), error: message.slice(0, 500) },
        });
      }
    }
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
  if (failures) process.exitCode = 1;
}

main();
