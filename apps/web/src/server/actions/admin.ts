"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { run, type ActionState } from "../action-result";
import { UserError } from "../errors";
import { courtSchema, eventSchema, eventStatusSchema, scoreSchema, slotSchema, updateMemberSchema, venueSchema } from "../schemas";
import { requireAdmin } from "../session";
import { createEvent, setEventStatus, updateEvent } from "../services/events";
import {
  completeRound,
  deleteDraftRound,
  generateRoundForEvent,
  publishRound,
  recordScore,
  updateRoundMatches,
  type MatchEdit,
} from "../services/matches";
import { updateMember } from "../services/members";
import {
  adminAddRegistration,
  adminConfirmRegistration,
  adminRemoveRegistration,
  setCheckIn,
} from "../services/registrations";
import { addCourt, addManualSlot, deleteCourt, deleteSlot, saveVenue, triggerCrawl } from "../services/venues";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");
const fields = (fd: FormData) => Object.fromEntries(fd);

// Members

export async function updateMemberAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  return run(async () => {
    await updateMember(admin.id, updateMemberSchema.parse(fields(fd)));
    revalidatePath("/admin/members");
    return "Saved";
  });
}

// Events

export async function createEventAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  let id = "";
  const result = await run(async () => {
    id = (await createEvent(eventSchema.parse(fields(fd)), admin.id)).id;
  });
  if (result?.ok) redirect(`/admin/events/${id}`);
  return result;
}

export async function updateEventAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const eventId = str(fd, "eventId");
  const result = await run(async () => {
    await updateEvent(eventId, eventSchema.parse(fields(fd)));
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
  });
  if (result?.ok) redirect(`/admin/events/${eventId}`);
  return result;
}

export async function setEventStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    const input = eventStatusSchema.parse(fields(fd));
    await setEventStatus(input.eventId, input.status);
    revalidatePath(`/admin/events/${input.eventId}`);
    revalidatePath("/admin/events");
    revalidatePath("/events");
  });
}

// Registrations

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/matches`);
  revalidatePath(`/events/${eventId}`);
}

export async function adminAddRegistrationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const eventId = str(fd, "eventId");
  return run(async () => {
    const userId = str(fd, "userId");
    if (!userId) throw new UserError("Pick a member");
    await adminAddRegistration(eventId, userId);
    revalidateEvent(eventId);
  });
}

export async function adminRemoveRegistrationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    await adminRemoveRegistration(str(fd, "registrationId"));
    revalidateEvent(str(fd, "eventId"));
  });
}

export async function adminConfirmRegistrationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    await adminConfirmRegistration(str(fd, "registrationId"));
    revalidateEvent(str(fd, "eventId"));
  });
}

export async function setCheckInAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    await setCheckIn(str(fd, "registrationId"), str(fd, "checkedIn") === "1");
    revalidateEvent(str(fd, "eventId"));
  });
}

// Matches

export async function generateRoundAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const eventId = str(fd, "eventId");
  return run(async () => {
    const courts = Number(str(fd, "courts")) || undefined;
    await generateRoundForEvent(eventId, courts);
    revalidateEvent(eventId);
  });
}

export async function updateRoundMatchesAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    const courts = str(fd, "courts").split(",").filter(Boolean).map(Number);
    const edits: MatchEdit[] = [];
    for (const court of courts) {
      const ids = ["a1", "a2", "b1", "b2"].map((k) => str(fd, `court_${court}_${k}`));
      if (ids.every((id) => !id)) continue;
      if (ids.some((id) => !id)) throw new UserError(`Court ${court} needs four players, or clear it completely`);
      edits.push({ court, teamA: [ids[0]!, ids[1]!], teamB: [ids[2]!, ids[3]!] });
    }
    if (!edits.length) throw new UserError("A round needs at least one match");
    await updateRoundMatches(str(fd, "roundId"), edits);
    revalidateEvent(str(fd, "eventId"));
    return "Matches saved";
  });
}

function roundAction(fn: (roundId: string) => Promise<void>) {
  return async (_: ActionState, fd: FormData): Promise<ActionState> => {
    await requireAdmin();
    return run(async () => {
      await fn(str(fd, "roundId"));
      revalidateEvent(str(fd, "eventId"));
    });
  };
}

export async function publishRoundAction(state: ActionState, fd: FormData) {
  return roundAction(publishRound)(state, fd);
}

export async function completeRoundAction(state: ActionState, fd: FormData) {
  return roundAction(completeRound)(state, fd);
}

export async function deleteDraftRoundAction(state: ActionState, fd: FormData) {
  return roundAction(deleteDraftRound)(state, fd);
}

export async function recordScoreAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    const input = scoreSchema.parse(fields(fd));
    await recordScore(input.matchId, input.scoreA, input.scoreB);
    revalidateEvent(str(fd, "eventId"));
  });
}

// Venues and courts

export async function saveVenueAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  let id = "";
  const result = await run(async () => {
    id = (await saveVenue(venueSchema.parse(fields(fd)))).id;
    revalidatePath("/admin/venues");
    revalidatePath("/courts");
  });
  if (result?.ok && !str(fd, "id")) redirect(`/admin/venues/${id}`);
  return result?.ok ? { ok: true, message: "Venue saved" } : result;
}

export async function addCourtAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    const input = courtSchema.parse(fields(fd));
    await addCourt(input.venueId, input.name);
    revalidatePath(`/admin/venues/${input.venueId}`);
  });
}

export async function deleteCourtAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    await deleteCourt(str(fd, "courtId"));
    revalidatePath(`/admin/venues/${str(fd, "venueId")}`);
  });
}

export async function addSlotAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    const raw = fields(fd);
    const input = slotSchema.parse({ ...raw, price: raw.price === "" ? undefined : raw.price });
    await addManualSlot(input);
    revalidatePath(`/admin/venues/${input.venueId}`);
    revalidatePath("/courts");
    return "Slot added";
  });
}

export async function deleteSlotAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    await deleteSlot(str(fd, "slotId"));
    revalidatePath(`/admin/venues/${str(fd, "venueId")}`);
    revalidatePath("/courts");
  });
}

export async function triggerCrawlAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    await triggerCrawl(str(fd, "venueId") || undefined);
    return "Crawl started. Refresh in a minute or two.";
  });
}
