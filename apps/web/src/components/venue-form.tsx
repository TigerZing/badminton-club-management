import type { Venue } from "@club/db";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Textarea } from "@/components/ui/input";
import { getT } from "@/lib/i18n/server";
import { saveVenueAction } from "@/server/actions/admin";

export async function VenueForm({ venue }: { venue?: Venue }) {
  const { t } = await getT();
  return (
    <ActionForm action={saveVenueAction}>
      {venue && <input type="hidden" name="id" value={venue.id} />}
      <Field label={t("adminVenues.name")} htmlFor="name">
        <Input id="name" name="name" defaultValue={venue?.name} required />
      </Field>
      <Field label={t("adminVenues.address")} htmlFor="address">
        <Input id="address" name="address" defaultValue={venue?.address ?? ""} />
      </Field>
      <Field label={t("adminVenues.mapUrl")} htmlFor="mapUrl">
        <Input id="mapUrl" name="mapUrl" type="url" defaultValue={venue?.mapUrl ?? ""} />
      </Field>
      <Field label={t("adminVenues.bookingUrl")} htmlFor="bookingUrl">
        <Input id="bookingUrl" name="bookingUrl" type="url" defaultValue={venue?.bookingUrl ?? ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("adminVenues.phone")} htmlFor="phone">
          <Input id="phone" name="phone" type="tel" defaultValue={venue?.phone ?? ""} />
        </Field>
        <Field label={t("adminVenues.website")} htmlFor="website">
          <Input id="website" name="website" type="url" defaultValue={venue?.website ?? ""} />
        </Field>
      </div>
      <Field label={t("adminVenues.description")} htmlFor="description" hint={t("adminVenues.descriptionHint")}>
        <Textarea id="description" name="description" rows={4} defaultValue={venue?.description ?? ""} />
      </Field>
      <Field label={t("adminVenues.howToBook")} htmlFor="bookingInfo" hint={t("adminVenues.bookingInfoHint")}>
        <Textarea id="bookingInfo" name="bookingInfo" rows={4} defaultValue={venue?.bookingInfo ?? ""} />
      </Field>
      <Field label={t("adminVenues.crawlerKey")} htmlFor="crawlerKey" hint={t("adminVenues.crawlerKeyHint")}>
        <Input id="crawlerKey" name="crawlerKey" defaultValue={venue?.crawlerKey ?? ""} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={venue?.isActive ?? true} className="size-4 accent-primary" />
        {t("adminVenues.showToMembers")}
      </label>
      <SubmitButton className="justify-self-start">{venue ? t("adminVenues.save") : t("adminVenues.add")}</SubmitButton>
    </ActionForm>
  );
}
