import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { prisma } from "@club/db";
import type { Locale } from "@/lib/i18n/config";
import { UserError } from "../errors";

// Looks a venue up on the web with Claude (web search + web fetch) and saves
// the phone number, website, a short description and how to book. The admin
// reviews and edits the result in the venue form.

const MODEL = "claude-opus-5-5";
const MAX_CONTINUATIONS = 4;

const resultSchema = z.object({
  found: z.boolean(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  bookingInfo: z.string().nullable(),
  sources: z.array(z.string()),
});
export type VenueInfo = z.infer<typeof resultSchema>;

const outputSchema = {
  type: "object",
  properties: {
    found: { type: "boolean", description: "False when no source clearly matches this venue." },
    phone: { type: ["string", "null"], description: "Booking or contact phone number as published, e.g. 0901 234 567." },
    website: { type: ["string", "null"], description: "Official website or Facebook/Zalo page URL." },
    description: { type: ["string", "null"], description: "2-4 sentences about the venue." },
    bookingInfo: { type: ["string", "null"], description: "How to book a court, as short plain-text steps." },
    sources: { type: "array", items: { type: "string" }, description: "URLs the facts came from." },
  },
  required: ["found", "phone", "website", "description", "bookingInfo", "sources"],
  additionalProperties: false,
} as const;

const LANGUAGE: Record<Locale, string> = { vi: "Vietnamese", en: "English" };

function buildPrompt(
  venue: { name: string; address: string | null; mapUrl: string | null; bookingUrl: string | null; website: string | null; phone: string | null },
  locale: Locale,
) {
  const known = [
    `Name: ${venue.name}`,
    venue.address && `Address: ${venue.address}`,
    venue.mapUrl && `Google Maps link: ${venue.mapUrl}`,
    venue.bookingUrl && `Booking website: ${venue.bookingUrl}`,
    venue.website && `Website: ${venue.website}`,
    venue.phone && `Phone: ${venue.phone}`,
  ].filter(Boolean);

  return `A badminton club plays at this venue and wants its contact and booking details on file. The venue may be in any country; use the address to tell.

${known.join("\n")}

Search the web for this venue, in the local language too, and open its most useful pages (official site, city or facility pages, Facebook or Zalo page, Google Maps listing, court booking apps or local reservation systems, local directories). Then report:
- phone: the number people call or message to book.
- website: the official website, or the Facebook page if there is no website.
- description: 2-4 sentences covering what a player wants to know, such as the number of badminton courts, floor type, opening hours, typical price per hour, parking and amenities. Only include what the sources say.
- bookingInfo: how to book a court, written as short steps or a short paragraph (for example call or message the number, use a named app, website or city reservation system, whether registration or a membership card is needed, deposit rules, how far ahead to book).
- sources: the URLs you took these facts from.

Write description and bookingInfo in ${LANGUAGE[locale]}. Use null for anything you could not confirm, and do not guess phone numbers or URLs. If none of the results clearly match this venue at this address, set found to false.`;
}

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new UserError("errors.lookupNotSetUp");
  return new Anthropic();
}

/** Runs the lookup and returns what Claude found, without saving it. */
export async function findVenueInfo(venueId: string, locale: Locale): Promise<VenueInfo> {
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) throw new UserError("errors.venueNotFound");
  const client = getClient();

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: buildPrompt(venue, locale) }];
  for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await client.beta.messages
        .stream({
          model: MODEL,
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          tools: [
            { type: "web_search_20260209", name: "web_search", max_uses: 6 },
            { type: "web_fetch_20260209", name: "web_fetch", max_uses: 6 },
          ],
          output_config: { format: { type: "json_schema", schema: outputSchema } },
          messages,
        })
        .finalMessage();
    } catch (e) {
      console.error("Venue lookup request failed", e);
      throw new UserError(accountProblem(e) ?? "errors.lookupFailed");
    }

    if (message.stop_reason === "pause_turn") {
      // A long run of server-side searches paused; send the turn back to continue it.
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    if (message.stop_reason !== "end_turn") {
      console.error("Venue lookup stopped early", message.stop_reason);
      throw new UserError("errors.lookupFailed");
    }

    const text = message.content.findLast((b) => b.type === "text");
    const parsed = text ? resultSchema.safeParse(safeJson(text.text)) : null;
    if (!parsed?.success) {
      console.error("Venue lookup returned unexpected output", text?.text);
      throw new UserError("errors.lookupFailed");
    }
    return parsed.data;
  }
  throw new UserError("errors.lookupFailed");
}

/** Problems with the Anthropic account that the admin can fix, rather than a failed search. */
function accountProblem(e: unknown) {
  if (!(e instanceof Anthropic.APIError)) return null;
  if (e.status === 401 || e.status === 403) return "errors.lookupBadKey" as const;
  if (e.status === 400 && /credit balance/i.test(e.message)) return "errors.lookupNoCredit" as const;
  return null;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const tidy = (v: string | null) => v?.trim() || null;
const httpUrl = (v: string | null) => {
  const url = tidy(v);
  return url && /^https?:\/\//i.test(url) ? url : null;
};

/** Looks the venue up and stores what was found. Fields the lookup could not confirm keep their current value. */
export async function lookupVenueInfo(venueId: string, locale: Locale) {
  const info = await findVenueInfo(venueId, locale);
  const found = {
    phone: tidy(info.phone),
    website: httpUrl(info.website),
    description: tidy(info.description),
    bookingInfo: tidy(info.bookingInfo),
  };
  if (!info.found || Object.values(found).every((v) => v === null)) throw new UserError("errors.lookupNothingFound");

  return prisma.venue.update({
    where: { id: venueId },
    data: {
      ...Object.fromEntries(Object.entries(found).filter(([, v]) => v !== null)),
      infoSources: info.sources.map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s)).slice(0, 10),
      infoUpdatedAt: new Date(),
    },
  });
}
