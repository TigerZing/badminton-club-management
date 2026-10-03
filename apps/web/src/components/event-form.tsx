import type { Event, Venue } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { getT } from "@/lib/i18n/server";
import { toClubInputs } from "@/lib/time";
import type { ActionState } from "@/server/action-result";

export async function EventForm({
  action,
  venues,
  event,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  venues: Venue[];
  event?: Event;
}) {
  const { t } = await getT();
  const start = event ? toClubInputs(event.startsAt) : null;
  const end = event ? toClubInputs(event.endsAt) : null;
  const deadline = event ? toClubInputs(event.registrationDeadline) : null;

  return (
    <ActionForm action={action}>
      {event && <input type="hidden" name="eventId" value={event.id} />}
      <Field label={t("adminEvents.fieldTitle")} htmlFor="title">
        <Input id="title" name="title" defaultValue={event?.title ?? t("adminEvents.defaultTitle")} required />
      </Field>
      <Field label={t("adminEvents.venue")} htmlFor="venueId">
        <Select id="venueId" name="venueId" defaultValue={event?.venueId ?? ""}>
          <option value="">{t("adminEvents.noVenue")}</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label={t("adminEvents.date")} htmlFor="date">
          <Input id="date" name="date" type="date" defaultValue={start?.date} required />
        </Field>
        <Field label={t("adminEvents.start")} htmlFor="startTime">
          <Input id="startTime" name="startTime" type="time" defaultValue={start?.time ?? "18:00"} required />
        </Field>
        <Field label={t("adminEvents.end")} htmlFor="endTime">
          <Input id="endTime" name="endTime" type="time" defaultValue={end?.time ?? "21:00"} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("adminEvents.courts")} htmlFor="courtCount">
          <Input id="courtCount" name="courtCount" type="number" min={1} defaultValue={event?.courtCount ?? 4} required />
        </Field>
        <Field label={t("adminEvents.maxPlayers")} htmlFor="maxPlayers">
          <Input id="maxPlayers" name="maxPlayers" type="number" min={4} defaultValue={event?.maxPlayers ?? 24} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("adminEvents.registrationCloses")} htmlFor="deadlineDate">
          <Input id="deadlineDate" name="deadlineDate" type="date" defaultValue={deadline?.date} required />
        </Field>
        <Field label={t("adminEvents.at")} htmlFor="deadlineTime">
          <Input id="deadlineTime" name="deadlineTime" type="time" defaultValue={deadline?.time ?? "12:00"} required />
        </Field>
      </div>
      <Field label={t("adminEvents.notes")} htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={event?.notes ?? ""} placeholder={t("adminEvents.notesPlaceholder")} />
      </Field>
      <SubmitButton className="justify-self-start">
        {event ? t("adminEvents.saveChanges") : t("adminEvents.createEvent")}
      </SubmitButton>
    </ActionForm>
  );
}
