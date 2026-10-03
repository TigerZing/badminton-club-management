"use server";

import { revalidatePath } from "next/cache";
import { run, type ActionState } from "../action-result";
import { profileSchema } from "../schemas";
import { requireUser } from "../session";
import { updateProfile } from "../services/members";
import { cancelRegistration, registerForEvent } from "../services/registrations";

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  return run(async () => {
    await updateProfile(user.id, profileSchema.parse(Object.fromEntries(formData)));
    revalidatePath("/me");
    return "Profile saved";
  });
}

export async function registerForEventAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const eventId = String(formData.get("eventId"));
  return run(async () => {
    const status = await registerForEvent(user.id, eventId);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    return status === "CONFIRMED" ? "You're in!" : "The event is full, so you're on the waitlist.";
  });
}

export async function cancelRegistrationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const eventId = String(formData.get("eventId"));
  return run(async () => {
    await cancelRegistration(user.id, eventId);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    return "Registration cancelled";
  });
}
