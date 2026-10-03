import { beforeEach, describe, expect, it, vi } from "vitest";

const finalMessage = vi.fn();
const stream = vi.fn(() => ({ finalMessage }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { stream } };
  },
}));

const venue = { id: "v1", name: "Nhà thi đấu Quận 1", address: "1 Lê Lợi", mapUrl: null, bookingUrl: null, website: null, phone: null };
const update = vi.fn(async (args: { data: object }) => ({ ...venue, ...args.data }));
vi.mock("@club/db", () => ({
  prisma: { venue: { findUnique: vi.fn(async () => venue), update: (args: { data: object }) => update(args) } },
}));

const { lookupVenueInfo } = await import("./venue-info");

const reply = (stop_reason: string, json?: object) => ({
  stop_reason,
  content: json ? [{ type: "text", text: JSON.stringify(json) }] : [{ type: "server_tool_use" }],
});

describe("lookupVenueInfo", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test";
    finalMessage.mockReset();
    stream.mockClear();
    update.mockClear();
  });

  it("continues paused turns and saves only the fields that were found", async () => {
    finalMessage.mockResolvedValueOnce(reply("pause_turn")).mockResolvedValueOnce(
      reply("end_turn", {
        found: true,
        phone: " 0901 234 567 ",
        website: "not a url",
        description: "6 sân thảm.",
        bookingInfo: null,
        sources: ["https://example.com/san", "javascript:alert(1)"],
      }),
    );

    await lookupVenueInfo("v1", "vi");

    expect(stream).toHaveBeenCalledTimes(2);
    const data = update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data).toMatchObject({ phone: "0901 234 567", description: "6 sân thảm.", infoSources: ["https://example.com/san"] });
    expect(data).not.toHaveProperty("website");
    expect(data).not.toHaveProperty("bookingInfo");
  });

  it("refuses to save when nothing matched", async () => {
    finalMessage.mockResolvedValueOnce(
      reply("end_turn", { found: false, phone: null, website: null, description: null, bookingInfo: null, sources: [] }),
    );
    await expect(lookupVenueInfo("v1", "en")).rejects.toMatchObject({ key: "errors.lookupNothingFound" });
    expect(update).not.toHaveBeenCalled();
  });

  it("explains how to set it up when there is no API key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(lookupVenueInfo("v1", "en")).rejects.toMatchObject({ key: "errors.lookupNotSetUp" });
  });

  it("reports a refusal as a failed lookup", async () => {
    finalMessage.mockResolvedValueOnce({ stop_reason: "refusal", content: [] });
    await expect(lookupVenueInfo("v1", "en")).rejects.toMatchObject({ key: "errors.lookupFailed" });
  });
});
