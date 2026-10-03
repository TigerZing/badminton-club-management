import type { SlotAdapter } from "../types";

// Register real booking-site adapters here, keyed by the venue's crawler key.
// See ./example.ts for a template.
const adapters: SlotAdapter[] = [];

export function getAdapter(key: string): SlotAdapter | undefined {
  return adapters.find((a) => a.key === key);
}
