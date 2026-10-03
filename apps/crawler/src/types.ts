import type { Browser } from "playwright";

export interface CrawledSlot {
  /** Court name as the booking site shows it, e.g. "Court 3". */
  courtLabel: string;
  startsAt: Date;
  endsAt: Date;
  available: boolean;
  /** Price in VND, when the site shows one. */
  price?: number;
}

export interface VenueToCrawl {
  id: string;
  name: string;
  bookingUrl: string | null;
}

/** One booking website. Add a file in ./adapters and register it in ./adapters/index.ts. */
export interface SlotAdapter {
  key: string;
  fetchSlots(ctx: { browser: Browser; venue: VenueToCrawl; from: Date; to: Date }): Promise<CrawledSlot[]>;
}
