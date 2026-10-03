import { Card, PageHeader } from "@/components/ui/card";
import { EventForm } from "@/components/event-form";
import { getT } from "@/lib/i18n/server";
import { createEventAction } from "@/server/actions/admin";
import { listVenues } from "@/server/services/venues";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("adminEvents.newEvent") };
}

export default async function NewEventPage() {
  const [{ t }, venues] = await Promise.all([getT(), listVenues({ activeOnly: true })]);
  return (
    <>
      <PageHeader title={t("adminEvents.newEvent")} description={t("adminEvents.newDescription")} />
      <Card>
        <EventForm action={createEventAction} venues={venues} />
      </Card>
    </>
  );
}
