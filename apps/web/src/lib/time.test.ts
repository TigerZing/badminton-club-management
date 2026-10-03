import { describe, expect, it } from "vitest";
import { clubDayRange, fromClubTime, toClubInputs } from "./time";

describe("club time", () => {
  it("round-trips a club date and time", () => {
    const d = fromClubTime("2026-10-10", "18:30");
    expect(d.toISOString()).toBe("2026-10-10T11:30:00.000Z");
    expect(toClubInputs(d)).toEqual({ date: "2026-10-10", time: "18:30" });
  });

  it("covers a whole club day", () => {
    const { start, end } = clubDayRange("2026-10-10");
    expect(start.toISOString()).toBe("2026-10-09T17:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(24 * 3600_000);
  });
});
