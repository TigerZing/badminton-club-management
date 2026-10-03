import type { SlotAdapter } from "../types";

/**
 * Template for a real booking site. Copy this file, change the key and the
 * selectors, then register it in ./index.ts and set the venue's crawler key
 * to the same value in the admin Venues page.
 */
export const exampleAdapter: SlotAdapter = {
  key: "example",
  async fetchSlots({ browser, venue, from }) {
    if (!venue.bookingUrl) throw new Error("Venue has no booking URL");
    const page = await browser.newPage();
    try {
      const date = from.toISOString().slice(0, 10);
      await page.goto(`${venue.bookingUrl}?date=${date}`, { waitUntil: "networkidle" });
      const rows = await page.$$eval("[data-slot]", (els) =>
        els.map((el) => ({
          court: el.getAttribute("data-court") ?? "",
          start: el.getAttribute("data-start") ?? "",
          end: el.getAttribute("data-end") ?? "",
          free: el.classList.contains("available"),
        })),
      );
      return rows.map((r) => ({
        courtLabel: r.court,
        startsAt: new Date(`${date}T${r.start}:00+07:00`),
        endsAt: new Date(`${date}T${r.end}:00+07:00`),
        available: r.free,
      }));
    } finally {
      await page.close();
    }
  },
};
