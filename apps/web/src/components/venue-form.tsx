import type { Venue } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input } from "@/components/ui/input";
import { saveVenueAction } from "@/server/actions/admin";

export function VenueForm({ venue }: { venue?: Venue }) {
  return (
    <ActionForm action={saveVenueAction}>
      {venue && <input type="hidden" name="id" value={venue.id} />}
      <Field label="Name" htmlFor="name">
        <Input id="name" name="name" defaultValue={venue?.name} required />
      </Field>
      <Field label="Address" htmlFor="address">
        <Input id="address" name="address" defaultValue={venue?.address ?? ""} />
      </Field>
      <Field label="Google Maps link" htmlFor="mapUrl">
        <Input id="mapUrl" name="mapUrl" type="url" defaultValue={venue?.mapUrl ?? ""} />
      </Field>
      <Field label="Booking website" htmlFor="bookingUrl">
        <Input id="bookingUrl" name="bookingUrl" type="url" defaultValue={venue?.bookingUrl ?? ""} />
      </Field>
      <Field label="Crawler key" htmlFor="crawlerKey" hint="Leave empty to enter free slots by hand. Set it once a crawler adapter exists for this site.">
        <Input id="crawlerKey" name="crawlerKey" defaultValue={venue?.crawlerKey ?? ""} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={venue?.isActive ?? true} className="size-4 accent-primary" />
        Show this venue to members
      </label>
      <SubmitButton className="justify-self-start">{venue ? "Save venue" : "Add venue"}</SubmitButton>
    </ActionForm>
  );
}
