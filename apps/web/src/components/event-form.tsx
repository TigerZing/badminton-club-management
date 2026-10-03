import type { Event, Venue } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { toClubInputs } from "@/lib/time";
import type { ActionState } from "@/server/action-result";

export function EventForm({
  action,
  venues,
  event,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  venues: Venue[];
  event?: Event;
}) {
  const start = event ? toClubInputs(event.startsAt) : null;
  const end = event ? toClubInputs(event.endsAt) : null;
  const deadline = event ? toClubInputs(event.registrationDeadline) : null;

  return (
    <ActionForm action={action}>
      {event && <input type="hidden" name="eventId" value={event.id} />}
      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" defaultValue={event?.title ?? "Weekend Club Session"} required />
      </Field>
      <Field label="Venue" htmlFor="venueId">
        <Select id="venueId" name="venueId" defaultValue={event?.venueId ?? ""}>
          <option value="">No venue yet</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Date" htmlFor="date">
          <Input id="date" name="date" type="date" defaultValue={start?.date} required />
        </Field>
        <Field label="Start" htmlFor="startTime">
          <Input id="startTime" name="startTime" type="time" defaultValue={start?.time ?? "18:00"} required />
        </Field>
        <Field label="End" htmlFor="endTime">
          <Input id="endTime" name="endTime" type="time" defaultValue={end?.time ?? "21:00"} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Courts" htmlFor="courtCount">
          <Input id="courtCount" name="courtCount" type="number" min={1} defaultValue={event?.courtCount ?? 4} required />
        </Field>
        <Field label="Max players" htmlFor="maxPlayers">
          <Input id="maxPlayers" name="maxPlayers" type="number" min={4} defaultValue={event?.maxPlayers ?? 24} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Registration closes" htmlFor="deadlineDate">
          <Input id="deadlineDate" name="deadlineDate" type="date" defaultValue={deadline?.date} required />
        </Field>
        <Field label="at" htmlFor="deadlineTime">
          <Input id="deadlineTime" name="deadlineTime" type="time" defaultValue={deadline?.time ?? "12:00"} required />
        </Field>
      </div>
      <Field label="Notes for members" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={event?.notes ?? ""} placeholder="Bring your own shuttles, court fee, etc." />
      </Field>
      <SubmitButton className="justify-self-start">{event ? "Save changes" : "Create event"}</SubmitButton>
    </ActionForm>
  );
}
